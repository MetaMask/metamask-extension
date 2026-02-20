// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import LocalWebSocketServer from './websocket-server';
import {
  WebSocketMessageMock,
  DEFAULT_HYPERLIQUID_WS_MOCKS,
  getResponsePayload,
} from './tests/perps/mocks/websocketDefaultMocks';

/**
 * Sets up Hyperliquid Perps WebSocket mocks with configurable message handlers.
 *
 * Messages from the PerpsController (or UI) to api.hyperliquid.xyz/ws are
 * forwarded to the local WebSocket server (localhost:8088) via mock-e2e.js.
 * This function adds handlers that respond with mock data for Hyperliquid
 * subscription types (l2Book, user, trades, etc.).
 *
 * @param mocks - Array of additional message mock configurations
 */
export async function setupPerpsWebsocketMocks(
  mocks: WebSocketMessageMock[] = [],
): Promise<void> {
  const localWebSocketServer = LocalWebSocketServer.getServerInstance();
  const wsServer = localWebSocketServer.getServer();

  const mergedMocks: WebSocketMessageMock[] = [
    ...mocks,
    ...DEFAULT_HYPERLIQUID_WS_MOCKS,
  ];

  // Add Perps/Hyperliquid-specific message handlers to the existing server
  wsServer.on('connection', (socket: WebSocket) => {
    socket.on('message', (data) => {
      const message = data.toString();

      // Only handle Hyperliquid-style messages (e.g. "method":"subscribe").
      // Avoid processing Solana messages (which contain "jsonrpc" and "signatureSubscribe" etc.).
      if (
        message.includes('jsonrpc') ||
        !message.includes('subscribe')
      ) {
        return;
      }

      for (const mock of mergedMocks) {
        const includes = Array.isArray(mock.messageIncludes)
          ? mock.messageIncludes
          : [mock.messageIncludes];

        const matches = includes.every((includeStr) =>
          message.includes(includeStr),
        );

        if (matches) {
          if (mock.logMessage) {
            console.log(mock.logMessage, false);
          }

          const delay = mock.delay || 100;
          setTimeout(() => {
            const payload = getResponsePayload(mock);
            socket.send(JSON.stringify(payload));
          }, delay);
          break;
        }
      }
    });
  });
}
