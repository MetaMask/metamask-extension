// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import LocalWebSocketServer from './websocket-server';
import { WebSocketMessageMock } from './tests/solana/mocks/websocketDefaultMocks';

/**
 * Sets up Solana WebSocket mocks with configurable message handlers
 *
 * @param mocks - Array of message mock configurations
 */
export async function setupSolanaWebsocketMocks(
  mocks: WebSocketMessageMock[] = [],
): Promise<void> {
  const localWebSocketServer = LocalWebSocketServer.getServerInstance();
  const wsServer = localWebSocketServer.getServer();

  // Add Solana-specific message handlers to the existing server
  wsServer.on('connection', (socket: WebSocket) => {
    console.log('Client connected to the local WebSocket server');

    // Handle messages from the client
    socket.on('message', (data) => {
      const message = data.toString();
      console.log('Message received from client:', message);

      // Check each mock configuration
      for (const mock of mocks) {
        const includes = Array.isArray(mock.messageIncludes)
          ? mock.messageIncludes
          : [mock.messageIncludes];

        // Check if all required strings are included in the message
        const matches = includes.every((includeStr) =>
          message.includes(includeStr),
        );

        if (matches) {
          if (mock.logMessage) {
            console.log(mock.logMessage);
          }

          const delay = mock.delay || 500;
          setTimeout(() => {
            socket.send(JSON.stringify(mock.response));
            console.log(
              `Simulated message sent to the client for: ${includes.join(' + ')}`,
            );
          }, delay);

          // Break after first match to avoid multiple responses
          break;
        }
      }
    });
  });
}
