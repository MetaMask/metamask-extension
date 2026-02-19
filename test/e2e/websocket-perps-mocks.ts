// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import LocalWebSocketServer from './websocket-server';
import {
  PerpsWebSocketMessageMock,
  DEFAULT_PERPS_WS_MOCKS,
} from './tests/perps/mocks/websocketDefaultMocks';

/**
 * Sets up Perps WebSocket mocks with configurable message handlers.
 *
 * @param mocks - Array of message mock configurations
 */
export async function setupPerpsWebsocketMocks(
  mocks: PerpsWebSocketMessageMock[] = [],
): Promise<void> {
  const localWebSocketServer = LocalWebSocketServer.getServerInstance();
  const wsServer = localWebSocketServer.getServer();

  const mergedMocks: PerpsWebSocketMessageMock[] = [
    ...mocks,
    ...DEFAULT_PERPS_WS_MOCKS,
  ];

  wsServer.on('connection', (socket: WebSocket) => {
    console.log('Client connected to the local Perps WebSocket server');

    socket.on('message', (data) => {
      const message = data.toString();
      console.log('Perps message received from client:', message, false);

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

          const delay = mock.delay || 500;
          setTimeout(() => {
            socket.send(JSON.stringify(mock.response));
            console.log(
              `Perps simulated message sent to client for: ${includes.join(' + ')}`,
              false,
            );
          }, delay);

          break;
        }
      }
    });
  });
}
