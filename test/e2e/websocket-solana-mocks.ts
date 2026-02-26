// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import LocalWebSocketServer from './websocket-server';
import {
  WebSocketMessageMock,
  DEFAULT_SOLANA_WS_MOCKS,
} from './tests/solana/mocks/websocketDefaultMocks';

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

  const mergedMocks: WebSocketMessageMock[] = [
    ...mocks,
    ...DEFAULT_SOLANA_WS_MOCKS,
  ];

  // Add Solana-specific message handlers to the existing server
  wsServer.on('connection', (socket: WebSocket) => {
    console.log('Client connected to the local WebSocket server');

    // Handle messages from the client
    socket.on('message', (data) => {
      const message = data.toString();
      console.log('Message received from client:', message, false);

      // Check each mock configuration
      for (const mock of mergedMocks) {
        const includes = Array.isArray(mock.messageIncludes)
          ? mock.messageIncludes
          : [mock.messageIncludes];

        // Check if all required strings are included in the message
        const matches = includes.every((includeStr) =>
          message.includes(includeStr),
        );

        if (matches) {
          if (mock.logMessage) {
            console.log(mock.logMessage, false);
          }

          // Extract the JSON-RPC id from the incoming message so the
          // response id matches (clients ignore mismatched ids).
          let requestId: string | number | null = null;
          try {
            const parsed = JSON.parse(message);
            requestId = parsed.id ?? null;
          } catch {
            // not valid JSON, leave requestId null
          }

          const delay = mock.delay || 500;
          setTimeout(() => {
            const response =
              requestId === null
                ? mock.response
                : { ...mock.response, id: requestId };
            socket.send(JSON.stringify(response));
            console.log(
              `Simulated message sent to the client for: ${includes.join(' + ')}`,
              false,
            );

            // Send follow-up response if configured (e.g. signatureNotification)
            if (mock.followUpResponse) {
              const followUpDelay = mock.followUpDelay || 1000;
              setTimeout(() => {
                socket.send(JSON.stringify(mock.followUpResponse));
                console.log(
                  `Follow-up message sent to the client for: ${includes.join(' + ')}`,
                  false,
                );
              }, followUpDelay);
            }
          }, delay);

          // Break after first match to avoid multiple responses
          break;
        }
      }
    });
  });
}
