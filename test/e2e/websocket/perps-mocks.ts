// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import {
  DEFAULT_HYPERLIQUID_WS_MOCKS,
  getResponsePayload,
} from '../tests/perps/mocks/websocketDefaultMocks';
import type { WebSocketMessageMock } from '../tests/solana/mocks/websocketDefaultMocks';
import type { WebSocketServiceConfig } from './registry';
import type LocalWebSocketServer from './server';
import { WEBSOCKET_SERVICES } from './constants';

export const PERPS_WS_PORT = 8090;

function rawDataToString(data: Buffer | ArrayBuffer | Buffer[]): string {
  if (Buffer.isBuffer(data)) {
    return data.toString('utf8');
  }
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString('utf8');
  }
  return Buffer.from(data).toString('utf8');
}

/**
 * Sets up Hyperliquid Perps WebSocket mocks.
 *
 * Messages from the PerpsController to api.hyperliquid.xyz/ws are forwarded
 * to this dedicated mock server via mock-e2e.js.
 *
 * @param server - The LocalWebSocketServer instance (injected by registry)
 * @param mocks - Per-test mock overrides (merged before defaults)
 */
async function setupPerpsWebsocketMocks(
  server: LocalWebSocketServer,
  mocks: WebSocketMessageMock[] = [],
): Promise<void> {
  const wsServer = server.getServer();

  const mergedMocks = [...mocks, ...DEFAULT_HYPERLIQUID_WS_MOCKS];

  wsServer.on('connection', (socket: WebSocket) => {
    console.log('[Perps] Client connected to Perps WebSocket server');

    socket.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
      const message = rawDataToString(data);
      console.log('[Perps] Message received from client:', message);

      for (const mock of mergedMocks) {
        const includes = Array.isArray(mock.messageIncludes)
          ? mock.messageIncludes
          : [mock.messageIncludes];

        const matches = includes.every((includeStr) =>
          message.includes(includeStr),
        );

        if (matches) {
          if (mock.logMessage) {
            console.log(`[Perps] ${mock.logMessage}`);
          }

          const delay = mock.delay || 100;
          setTimeout(() => {
            const payload = getResponsePayload(mock);
            socket.send(JSON.stringify(payload));
            console.log(
              `[Perps] Simulated message sent to the client for: ${includes.join(' + ')}`,
            );
          }, delay);
          break;
        }
      }
    });
  });
}

export const perpsWebSocketConfig: WebSocketServiceConfig = {
  name: WEBSOCKET_SERVICES.perps,
  port: PERPS_WS_PORT,
  setup: setupPerpsWebsocketMocks,
};
