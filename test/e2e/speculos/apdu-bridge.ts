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

type WsConnectionState = {
  framingSession: LedgerHidFramingSession | null;
};

export class ApduBridge {
  private wss: WebSocketServer | null = null;

  private client: SpeculosClient;

  private port: number;

  private readonly emitter = new EventEmitter();

  private readonly connectionState = new WeakMap<
    WsWebSocket,
    WsConnectionState
  >();

  private signingGateResolve: (() => void) | null = null;

  private signingGatePromise: Promise<void> | null = null;

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
    console.log('[ApduBridge] waitForSigningApdu called');
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

  /**
   * Wait for a signing APDU, perform button presses, then release the gate
   * @param speculosClient
   * @param rightPresses
   * @param timeout
   */
  async waitForSigningApduAndApprove(
    speculosClient: SpeculosClient,
    rightPresses: number,
    timeout = 30000,
  ): Promise<Buffer> {
    const apdu = await this.waitForSigningApdu(timeout);
    await new Promise((r) => setTimeout(r, 1500));
    for (let i = 0; i < rightPresses; i++) {
      await speculosClient.pressButton('right');
      await new Promise((r) => setTimeout(r, 500));
    }
    await speculosClient.pressButton('both');
    await new Promise((r) => setTimeout(r, 500));
    return apdu;
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

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port: this.port });

      this.wss.on('connection', (ws: WsWebSocket) => {
        console.log('[ApduBridge] Client connected');
        this.connectionState.set(ws, { framingSession: null });

        ws.on('message', async (data) => {
          const msgStr = data.toString();
          console.log(
            '[ApduBridge] Received message from client:',
            msgStr.substring(0, 200),
          );
          // Handle debug messages (not real HID frames)
          try {
            const parsed = JSON.parse(msgStr);
            if (parsed.type === 'DEBUG') {
              console.log(
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
    console.log(
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
      console.log(
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

    console.log(
      '[ApduBridge] handleHidSend: APDU reassembled, sending to Speculos, bytes:',
      apdu.length,
      'hex:',
      apdu.toString('hex'),
    );

    if (apdu.length >= 2 && apdu[0] === 0xe0 && (apdu[1] === 0x04 || apdu[1] === 0x08 || apdu[1] === 0x1a || apdu[1] === 0x20 || apdu[1] === 0x22)) {
      this.emitter.emit('signing-apdu', apdu);
      console.log('[ApduBridge] Signing APDU detected, forwarding to Speculos immediately');
    }

    let response = await this.client.exchange(apdu);
    console.log(
      '[ApduBridge] handleHidSend: got response from Speculos, bytes:',
      response.length,
      'hex:',
      response.toString('hex'),
    );

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
        console.log(
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
}
