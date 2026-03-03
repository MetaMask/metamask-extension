// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import LocalWebSocketServer from './websocket-server';
import {
  WebSocketMessageMock,
  DEFAULT_SOLANA_WS_MOCKS,
} from './tests/solana/mocks/websocketDefaultMocks';

/**
 * Sets up Solana WebSocket mocks with configurable message handlers.
 * Registers a single connection handler (cleared each test in helpers.js)
 * so we do not accumulate listeners across tests.
 *
 * @param mocks - Array of message mock configurations
 */
export async function setupSolanaWebsocketMocks(
  mocks: WebSocketMessageMock[] = [],
): Promise<void> {
  const localWebSocketServer = LocalWebSocketServer.getServerInstance();

  const mergedMocks: WebSocketMessageMock[] = [
    ...mocks,
    ...DEFAULT_SOLANA_WS_MOCKS,
  ];

  localWebSocketServer.addMockConnectionHandler((socket: WebSocket) => {
    console.log('Client connected to the local WebSocket server');

    socket.on('message', (data) => {
      const message = data.toString();
      console.log('Message received from client:', message, false);

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

          break;
        }
      }
    });
  });
}
