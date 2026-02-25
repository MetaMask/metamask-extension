// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import {
  WebSocketMessageMock,
  DEFAULT_SOLANA_WS_MOCKS,
} from '../tests/solana/mocks/websocketDefaultMocks';
import WebSocketRegistry from './registry';
import type LocalWebSocketServer from './server';

export const SOLANA_WS_PORT = 8088;

/**
 * Sets up Solana WebSocket mocks with configurable message handlers.
 *
 * @param server - The LocalWebSocketServer instance (injected by registry)
 * @param mocks - Per-test mock overrides (merged before defaults)
 */
async function setupSolanaWebsocketMocks(
  server: LocalWebSocketServer,
  mocks: WebSocketMessageMock[] = [],
): Promise<void> {
  const wsServer = server.getServer();

  const mergedMocks: WebSocketMessageMock[] = [
    ...mocks,
    ...DEFAULT_SOLANA_WS_MOCKS,
  ];

  wsServer.on('connection', (socket: WebSocket) => {
    console.log('[Solana] Client connected to Solana WebSocket server');

    socket.on('message', (data) => {
      const message = data.toString();
      console.log('[Solana] Message received from client:', message);

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
            console.log(`[Solana] ${mock.logMessage}`);
          }

          // Extract JSON-RPC id so the response id matches
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
              `[Solana] Simulated message sent to the client for: ${includes.join(' + ')}`,
            );

            // Send follow-up response if configured (e.g. signatureNotification)
            if (mock.followUpResponse) {
              const followUpDelay = mock.followUpDelay || 1000;
              setTimeout(() => {
                socket.send(JSON.stringify(mock.followUpResponse));
                console.log(
                  `[Solana] Follow-up message sent to the client for: ${includes.join(' + ')}`,
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

// Self-register with the registry on import
WebSocketRegistry.register('solana', SOLANA_WS_PORT, setupSolanaWebsocketMocks);

export { setupSolanaWebsocketMocks };
