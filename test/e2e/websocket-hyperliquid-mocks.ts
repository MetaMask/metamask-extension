// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import LocalWebSocketServer from './websocket-server';
import {
  DEFAULT_HYPERLIQUID_WS_MOCKS,
  WebSocketMessageMock,
} from './tests/perps/mocks/websocketDefaultMocks';

/**
 * Sets up Hyperliquid WebSocket mocks with configurable message handlers.
 *
 * Note: WebSocket handshake requests are forwarded to `ws://localhost:8088`
 * via `test/e2e/mock-e2e.js`.
 *
 * @param mocks - Array of message mock configurations
 */
export async function setupHyperliquidWebsocketMocks(
  mocks: WebSocketMessageMock[] = [],
): Promise<void> {
  const localWebSocketServer = LocalWebSocketServer.getServerInstance();
  const wsServer = localWebSocketServer.getServer();

  const mergedMocks: WebSocketMessageMock[] = [
    ...mocks,
    ...DEFAULT_HYPERLIQUID_WS_MOCKS,
  ];

  wsServer.on('connection', (socket: WebSocket) => {
    console.log('Client connected to the local WebSocket server (Hyperliquid)');

    socket.on('message', (data) => {
      const message = data.toString();
      console.log(
        'Message received from client (Hyperliquid):',
        message,
        false,
      );

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

          const delay = mock.delay ?? 50;
          setTimeout(() => {
            socket.send(JSON.stringify(mock.response));
            console.log(
              `Simulated message sent to the client for: ${includes.join(' + ')}`,
              false,
            );
          }, delay);

          break;
        }
      }
    });
  });
}
