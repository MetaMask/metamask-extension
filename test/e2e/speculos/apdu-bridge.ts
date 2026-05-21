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

  private readonly connectionState = new WeakMap<
    WsWebSocket,
    WsConnectionState
  >();

  constructor(client: SpeculosClient, port: number) {
    this.client = client;
    this.port = port;
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
      return;
    }

    console.log(
      '[ApduBridge] handleHidSend: APDU reassembled, sending to Speculos, bytes:',
      apdu.length,
      'hex:',
      apdu.toString('hex'),
    );
    const response = await this.client.exchange(apdu);
    console.log(
      '[ApduBridge] handleHidSend: got response from Speculos, bytes:',
      response.length,
      'hex:',
      response.toString('hex'),
    );
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
