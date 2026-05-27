import { EventEmitter } from 'events';
import { WebSocketServer } from 'ws';
import type { WebSocket as WsWebSocket } from 'ws';
import { SpeculosClient } from './client';
import {
  createLedgerHidFramingSession,
  encodeLedgerHidResponse,
  pushLedgerHidFrame,
  type LedgerHidFramingSession,
} from './ledger-hid-framing';
import type { DeviceInteraction } from './device-interaction';

function logSpeculosVerbose(...args: unknown[]): void {
  if (process.env.SPECULOS_VERBOSE === 'true') {
    console.log(...args);
  }
}

type WsConnectionState = {
  framingSession: LedgerHidFramingSession | null;
};

export class ApduBridge {
  private wss: WebSocketServer | null = null;

  private client: SpeculosClient;

  private port: number;

  private readonly emitter = new EventEmitter();

  private readonly signingReadyEmitter = new EventEmitter();

  private readonly connectionState = new WeakMap<
    WsWebSocket,
    WsConnectionState
  >();

  private signingGateResolve: (() => void) | null = null;

  private signingGatePromise: Promise<void> | null = null;

  private injectedErrorStatusCode: number | null = null;

  private signingInProgress = false;

  private signingResponse: Buffer | null = null;

  private signingWaiters: {
    apdu: Buffer;
    resolve: (response: Buffer) => void;
    reject: (error: Error) => void;
  }[] = [];

  private signTxTotalDataLen: number | null = null;

  private signTxDataSent: number = 0;

  constructor(client: SpeculosClient, port: number) {
    this.client = client;
    this.port = port;
    this.emitter.setMaxListeners(20);
  }

  /**
   * Wait for a signing APDU to be sent to Speculos
   * INS=0x04 sign tx, INS=0x08 sign msg, INS=0x1a sign EIP-712, INS=0x20 sign EIP-712 v2, INS=0x22 sign EIP-712 hashed
   * @param timeout
   */
  waitForSigningApdu(timeout = 30000): Promise<Buffer> {
    let timer: ReturnType<typeof setTimeout>;
    return new Promise((resolve, reject) => {
      const handler = (apdu: Buffer) => {
        clearTimeout(timer);
        resolve(apdu);
      };
      timer = setTimeout(() => {
        this.emitter.removeListener('signing-apdu', handler);
        reject(new Error('Timeout waiting for signing APDU'));
      }, timeout);
      this.emitter.once('signing-apdu', handler);
    });
  }

  async waitForSigningApduAndApprove(
    interaction: DeviceInteraction,
    timeout = 30000,
  ): Promise<Buffer> {
    const apdu = await this.waitForSigningApdu(timeout);
    await new Promise((r) => setTimeout(r, 1500));
    await interaction.approveTransaction();
    return apdu;
  }

  async waitForSigningApduAndApproveSigning(
    interaction: DeviceInteraction,
    timeout = 30000,
  ): Promise<Buffer> {
    const apdu = await this.waitForSigningApdu(timeout);
    await new Promise((r) => setTimeout(r, 1500));
    await interaction.approveSigning();
    return apdu;
  }

  async waitForSigningApduAndApproveBlindSigning(
    interaction: DeviceInteraction,
    timeout = 30000,
    scrollCount?: number,
  ): Promise<Buffer> {
    const apdu = await this.waitForSigningApdu(timeout);
    await this.waitForSigningReady(timeout);
    await interaction.approveBlindSigning(scrollCount);
    return apdu;
  }

  /**
   * Wait for the Ledger to show the signing review UI (all APDU chunks received).
   * Fires when a signing exchange takes longer than the acknowledgment threshold,
   * meaning the device is waiting for user input rather than just acknowledging
   * continuation chunks.
   * @param timeout
   */
  waitForSigningReady(timeout = 30000): Promise<void> {
    let timer: ReturnType<typeof setTimeout>;
    return new Promise((resolve, reject) => {
      const handler = () => {
        clearTimeout(timer);
        resolve();
      };
      timer = setTimeout(() => {
        this.signingReadyEmitter.removeListener('signing-ready', handler);
        reject(new Error('Timeout waiting for signing ready'));
      }, timeout);
      this.signingReadyEmitter.once('signing-ready', handler);
    });
  }

  /** Release the gate so the signing APDU can be forwarded to Speculos */
  releaseSigningGate(): void {
    if (this.signingGateResolve) {
      console.log('[ApduBridge] Signing gate released');
      this.signingGateResolve();
      this.signingGateResolve = null;
      this.signingGatePromise = null;
    }
  }

  getClient(): SpeculosClient {
    return this.client;
  }

  /**
   * Inject an error status code on the NEXT APDU exchange.
   * The real Speculos response is discarded and only the 2-byte SW is returned.
   * Auto-clears after one use.
   *
   * Useful for testing error modals:
   * 0x6d00 = DeviceStateEthAppClosed ("Open Ethereum app")
   * 0x5515 = AuthenticationDeviceLocked ("Ledger locked")
   * 0x6985 = UserRejected (silently dismissed, no modal)
   *
   * @param statusCode - 16-bit APDU status word (e.g. 0x6d00)
   */
  injectNextErrorResponse(statusCode: number): void {
    this.injectedErrorStatusCode = statusCode;
    console.log(
      `[ApduBridge] Will inject error 0x${statusCode.toString(16)} on next exchange`,
    );
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port: this.port });

      this.wss.on('connection', (ws: WsWebSocket) => {
        console.log('[ApduBridge] Client connected');
        this.connectionState.set(ws, { framingSession: null });

        ws.on('message', async (data) => {
          const msgStr = data.toString();
          logSpeculosVerbose(
            '[ApduBridge] Received message from client:',
            msgStr.substring(0, 200),
          );
          // Handle debug messages (not real HID frames)
          try {
            const parsed = JSON.parse(msgStr);
            if (parsed.type === 'DEBUG') {
              logSpeculosVerbose(
                '[ApduBridge] DEBUG:',
                parsed.msg,
                parsed.action || '',
              );
              return;
            }
          } catch (_e) {
            // Not a Speculos automation event, ignore
          }
          // Parse id up-front so the error path never re-throws on malformed JSON.
          let messageId: number | undefined;
          try {
            const message = JSON.parse(data.toString());
            messageId = message.id;

            if (message.type === 'HID_SEND') {
              await this.handleHidSend(ws, message);
              return;
            }

            // Legacy raw APDU (kept for debugging / direct clients)
            if (message.type === 'APDU_REQUEST') {
              const apduData = Buffer.from(message.data);
              const response = await this.client.exchange(apduData);

              ws.send(
                JSON.stringify({
                  type: 'APDU_RESPONSE',
                  id: message.id,
                  data: Array.from(response),
                }),
              );
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            ws.send(
              JSON.stringify({
                type: 'APDU_ERROR',
                id: messageId,
                error: errorMessage,
              }),
            );
          }
        });

        ws.on('close', () => {
          console.log('[ApduBridge] Client disconnected');
          this.connectionState.delete(ws);
        });
      });

      this.wss.on('error', (error) => {
        console.error('[ApduBridge] Server error:', error);
        reject(error);
      });

      this.wss.on('listening', () => {
        console.log(`[ApduBridge] Server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  private async handleHidSend(
    ws: WsWebSocket,
    message: { id?: number; data: number[] },
  ): Promise<void> {
    logSpeculosVerbose(
      '[ApduBridge] handleHidSend: processing HID frame id=',
      message.id,
      'bytes:',
      message.data.length,
    );
    const frame = Buffer.from(message.data);
    let state = this.connectionState.get(ws);
    if (!state) {
      state = { framingSession: null };
      this.connectionState.set(ws, state);
    }

    if (!state.framingSession) {
      state.framingSession = createLedgerHidFramingSession(frame);
    }

    const apdu = pushLedgerHidFrame(state.framingSession, frame);
    if (!apdu) {
      logSpeculosVerbose(
        '[ApduBridge] handleHidSend: frame buffered, waiting for more frames',
      );
      ws.send(
        JSON.stringify({
          type: 'HID_FRAME_ACK',
          id: message.id,
        }),
      );
      return;
    }

    logSpeculosVerbose(
      '[ApduBridge] handleHidSend: APDU reassembled, sending to Speculos, bytes:',
      apdu.length,
      'hex:',
      apdu.toString('hex'),
    );

    const isSignTx = apdu.length >= 2 && apdu[0] === 0xe0 && apdu[1] === 0x04;
    const isSigningIns =
      apdu.length >= 2 &&
      apdu[0] === 0xe0 &&
      (apdu[1] === 0x04 ||
        apdu[1] === 0x08 ||
        apdu[1] === 0x1a ||
        apdu[1] === 0x20 ||
        apdu[1] === 0x22);

    const isSignTxFirst = isSignTx && apdu[2] === 0x00;
    const isSignTxContinuation = isSignTx && apdu[2] === 0x80;
    const dataLen = apdu.length > 5 ? apdu.length - 5 : 0;

    // Track total expected data length from the first chunk to detect
    // when the last chunk is ambiguous (exactly 255 bytes).
    if (isSignTxFirst && apdu.length > 5) {
      const totalPayloadLen = this.#parseTxPayloadLength(apdu.slice(5));
      if (totalPayloadLen !== null) {
        this.signTxTotalDataLen = totalPayloadLen;
        this.signTxDataSent = dataLen;
        logSpeculosVerbose(
          `[ApduBridge] Sign tx: totalPayload=${this.signTxTotalDataLen} firstChunkData=${dataLen} chunks=${Math.ceil(this.signTxTotalDataLen / 255)} lastChunkSize=${this.signTxTotalDataLen % 255}`,
        );
      }
    } else if (isSignTxContinuation) {
      this.signTxDataSent += dataLen;
    }

    // For INS=0x04 (sign tx), only emit signing-apdu on the initial chunk
    // (P1=0x00). Continuation chunks (P1=0x80) are acknowledgments and should
    // not trigger the signing approval flow. For other signing INS values
    // (personal sign, EIP-712) there is no chunking, so always emit.
    const isSigningFirstChunk = isSigningIns && apdu[2] === 0x00;
    const isOtherSigning = isSigningIns && apdu[1] !== 0x04;

    if (isSigningFirstChunk || isOtherSigning) {
      this.emitter.emit('signing-apdu', apdu);
      logSpeculosVerbose(
        '[ApduBridge] Signing APDU detected, forwarding to Speculos',
      );
    }

    // Detect when the exchange blocks (Ledger showing signing UI).
    // Quick responses (<500ms) are continuation chunk acknowledgments.
    // A blocking exchange means the device is waiting for user input.
    //
    // For multi-chunk signing (INS=0x04), only start the timer on the
    // last continuation chunk. Earlier chunks return 0x9000 immediately
    // and would clear the timer before it fires.
    // For non-chunked signing (personal sign, EIP-712), always start it.
    const isLastSignTxChunk =
      isSignTxContinuation &&
      this.signTxTotalDataLen !== null &&
      this.signTxDataSent >= this.signTxTotalDataLen;
    const isSingleChunkSignTx =
      isSignTxFirst &&
      this.signTxTotalDataLen !== null &&
      this.signTxDataSent >= this.signTxTotalDataLen;
    // Start a timer to detect when the exchange blocks (Ledger showing signing UI).
    // For multi-chunk signing (INS=0x04), the last continuation chunk's exchange
    // blocks in Speculos because the device is waiting for user approval.
    // For single-chunk signing (small tx fits in one APDU), the first chunk IS
    // also the last — the exchange blocks waiting for approval on flex/stax.
    // For non-chunked signing (personal sign, EIP-712), there's only one exchange
    // that blocks until approval, so always start the timer.
    const shouldStartSigningTimer =
      isSigningIns &&
      (!isSignTx || isLastSignTxChunk || isSingleChunkSignTx);
    if (isSigningIns && isSignTx && (isLastSignTxChunk || isSingleChunkSignTx)) {
      logSpeculosVerbose(
        `[ApduBridge] Last signing chunk: dataSent=${this.signTxDataSent} total=${this.signTxTotalDataLen}`,
      );
    }
    let signingReadyFired = false;
    const signingReadyTimer = shouldStartSigningTimer
      ? setTimeout(() => {
          signingReadyFired = true;
          this.signingReadyEmitter.emit('signing-ready');
          logSpeculosVerbose(
            '[ApduBridge] Signing ready — Ledger showing review UI (timer)',
          );
        }, 500)
      : null;
    // For multi-chunk signing where the last chunk returns quickly (Speculos),
    // emit signing-ready immediately after the last chunk response.
    const shouldEmitSigningReadyOnLastChunk =
      (isLastSignTxChunk || isSingleChunkSignTx) && !signingReadyFired;

    const shouldQueueSigning = isSigningIns && this.signingInProgress;
    if (isSigningIns && !this.signingInProgress) {
      this.signingInProgress = true;
      this.signingResponse = null;
    }

    let response: Buffer;

    if (shouldQueueSigning) {
      logSpeculosVerbose(
        '[ApduBridge] Signing exchange already in progress, waiting for completion',
      );
      response = await new Promise<Buffer>((resolve, reject) => {
        this.signingWaiters.push({ apdu, resolve, reject });
      });
    } else {
      response = await this.client.exchange(apdu);

      if (signingReadyTimer) {
        clearTimeout(signingReadyTimer);
      }

      if (isSigningIns) {
        this.signingResponse = response;
        this.signingInProgress = false;
        for (const waiter of this.signingWaiters) {
          waiter.resolve(response);
        }
        this.signingWaiters = [];
      }

      // For multi-chunk signing where the last chunk returns quickly,
      // emit signing-ready since the Ledger is now showing the review UI.
      if (shouldEmitSigningReadyOnLastChunk && !signingReadyFired) {
        signingReadyFired = true;
        this.signingReadyEmitter.emit('signing-ready');
        logSpeculosVerbose(
          '[ApduBridge] Signing ready — last chunk received, Ledger showing review UI',
        );
      }
    }

    // Handle the "last chunk" edge case for INS=0x04 multi-chunk signing.
    // On nanosp/nanox, all chunks return 9000 and a terminator is needed.
    // On flex/stax, the last chunk blocks until user approval.
    const isLastChunkWithAck =
      (isSignTxContinuation || isSingleChunkSignTx) &&
      this.signTxTotalDataLen !== null &&
      this.signTxDataSent >= this.signTxTotalDataLen &&
      response.length === 2 &&
      response[0] === 0x90 &&
      response[1] === 0x00;

    if (isLastChunkWithAck) {
      logSpeculosVerbose(
        `[ApduBridge] Last chunk acknowledged (dataSent=${this.signTxDataSent} total=${this.signTxTotalDataLen}). Sending empty terminator.`,
      );
      const emptyChunk = Buffer.from([0xe0, 0x04, 0x80, 0x00, 0x00]);
      const readyTimer = setTimeout(() => {
        signingReadyFired = true;
        this.signingReadyEmitter.emit('signing-ready');
        logSpeculosVerbose('[ApduBridge] Signing ready — Ledger showing review UI');
      }, 500);
      response = await this.client.exchange(emptyChunk);
      clearTimeout(readyTimer);
      logSpeculosVerbose(
        '[ApduBridge] Terminator response, bytes:',
        response.length,
      );
      this.signTxTotalDataLen = null;
      this.signTxDataSent = 0;
    } else if (!isSignTx || (isSingleChunkSignTx && response.length > 2)) {
      this.signTxTotalDataLen = null;
      this.signTxDataSent = 0;
    }

    // One-shot error injection: replace the real response with a 2-byte SW
    const injectedCode = this.injectedErrorStatusCode;
    this.injectedErrorStatusCode = null;
    if (injectedCode === null) {
      logSpeculosVerbose(
        '[ApduBridge] handleHidSend: got response from Speculos, bytes:',
        response.length,
        'hex:',
        response.toString('hex'),
      );
    } else {
      const sw1 = Math.floor(injectedCode / 256);
      const sw2 = injectedCode % 256;
      response = Buffer.from([sw1, sw2]);
      console.log(
        `[ApduBridge] Injected error response: 0x${injectedCode.toString(16)}`,
      );
    }

    // Ethereum GET APP CONFIGURATION: CLA=0xE0 INS=0x06
    // Speculos returns arbitraryDataEnabled=0 but MetaMask requires 1 for blind signing.
    // Patch the first byte of the response payload to enable it.
    if (
      apdu.length >= 2 &&
      apdu[0] === 0xe0 &&
      apdu[1] === 0x06 &&
      response.length >= 3
    ) {
      const sw1 = response[response.length - 2];
      const sw2 = response[response.length - 1];
      if (sw1 === 0x90 && sw2 === 0x00 && response[0] !== 1) {
        response = Buffer.from([
          1,
          ...response.slice(1),
        ]);
        logSpeculosVerbose(
          '[ApduBridge] Patched GET APP CONFIGURATION: arbitraryDataEnabled set to 1',
        );
      }
    }
    const responseFrames = encodeLedgerHidResponse(
      state.framingSession,
      response,
    );

    for (const responseFrame of responseFrames) {
      ws.send(
        JSON.stringify({
          type: 'HID_RECV',
          id: message.id,
          data: Array.from(responseFrame),
        }),
      );
    }

    ws.send(
      JSON.stringify({
        type: 'HID_EXCHANGE_COMPLETE',
        id: message.id,
      }),
    );

    // Reset framing session for next exchange
    state.framingSession = null;
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.wss) {
        resolve();
        return;
      }

      this.wss.clients.forEach((client) => {
        client.terminate();
      });

      const forceCloseTimer = setTimeout(() => {
        if (this.wss) {
          console.log('[ApduBridge] Force closing server');
          this.wss = null;
          resolve();
        }
      }, 1000);

      this.wss.close(() => {
        clearTimeout(forceCloseTimer);
        console.log('[ApduBridge] Server stopped');
        this.wss = null;
        resolve();
      });
    });
  }

  getPort(): number {
    return this.port;
  }

  /**
   * Parse the total transaction payload length from the first signing chunk.
   * The first chunk contains: [derivation path bytes][tx data]
   * For typed transactions (EIP-1559): tx data = [type byte][RLP list]
   * For legacy transactions: tx data = [RLP list]
   * We need the total tx data length to predict the last chunk.
   * @param firstChunkData
   */
  #parseTxPayloadLength(firstChunkData: Buffer): number | null {
    if (firstChunkData.length < 6) {
      return null;
    }
    try {
      const pathCount = firstChunkData[0];
      const pathBytes = pathCount * 4;
      const txStart = 1 + pathBytes;
      if (txStart >= firstChunkData.length) {
        return null;
      }
      const txData = firstChunkData.slice(txStart);
      if (txData.length === 0) {
        return null;
      }
      let rlpStart = 0;
      if (txData[0] >= 0x01 && txData[0] <= 0x7f) {
        rlpStart = 1;
      }
      if (rlpStart >= txData.length) {
        return null;
      }
      const rlpResult = this.#decodeRlpLength(txData, rlpStart);
      if (!rlpResult) {
        return null;
      }
      return pathBytes + 1 + rlpStart + rlpResult.headerSize + rlpResult.length;
    } catch {
      return null;
    }
  }

  /**
   * Decode an RLP length prefix at the given offset.
   * Returns { headerSize, length } where headerSize is the bytes consumed by
   * the prefix and length is the decoded content length.
   * @param data
   * @param offset
   */
  #decodeRlpLength(
    data: Buffer,
    offset: number,
  ): { headerSize: number; length: number } | null {
    if (offset >= data.length) {
      return null;
    }
    const prefix = data[offset];
    if (prefix <= 0x7f) {
      return { headerSize: 0, length: 1 };
    }
    if (prefix <= 0xb7) {
      return { headerSize: 1, length: prefix - 0x80 };
    }
    if (prefix <= 0xbf) {
      const lenOfLen = prefix - 0xb7;
      if (offset + 1 + lenOfLen > data.length) {
        return null;
      }
      let len = 0;
      for (let i = 0; i < lenOfLen; i++) {
        // eslint-disable-next-line no-bitwise
        len = (len << 8) | data[offset + 1 + i];
      }
      return { headerSize: 1 + lenOfLen, length: len };
    }
    if (prefix <= 0xf7) {
      return { headerSize: 1, length: prefix - 0xc0 };
    }
    const lenOfLen2 = prefix - 0xf7;
    if (offset + 1 + lenOfLen2 > data.length) {
      return null;
    }
    let len2 = 0;
    for (let i = 0; i < lenOfLen2; i++) {
      // eslint-disable-next-line no-bitwise
      len2 = (len2 << 8) | data[offset + 1 + i];
    }
    return { headerSize: 1 + lenOfLen2, length: len2 };
  }
}
