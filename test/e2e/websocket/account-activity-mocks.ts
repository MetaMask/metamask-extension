// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import type { WebSocketMessageMock } from './types';
import type { WebSocketServiceConfig } from './registry';
import type LocalWebSocketServer from './server';
import { WEBSOCKET_SERVICES } from './constants';

export const ACCOUNT_ACTIVITY_WS_PORT = 8089;

// Subscription tracking — allows tests to wait until the mock has fully
// processed a subscribe handshake before pushing notifications.
type SubscriptionWaiter = {
  resolve: (subscriptionId: string) => void;
  timer: ReturnType<typeof setTimeout>;
};

let subscriptionWaiters: SubscriptionWaiter[] = [];

/**
 * Returns a Promise that resolves with the subscriptionId once the next
 * AccountActivity subscribe handshake completes on the mock server.
 * Call this BEFORE the extension connects so the waiter is registered in time.
 *
 * @param timeoutMs - Maximum time to wait for the subscription
 */
export function waitForAccountActivitySubscription(
  timeoutMs = 30_000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const entry: SubscriptionWaiter = {
      resolve: (subscriptionId: string) => {
        clearTimeout(entry.timer);
        resolve(subscriptionId);
      },
      timer: setTimeout(() => {
        subscriptionWaiters = subscriptionWaiters.filter((w) => w !== entry);
        reject(
          new Error(
            `Timed out after ${timeoutMs}ms waiting for AccountActivity subscription`,
          ),
        );
      }, timeoutMs),
    };

    subscriptionWaiters.push(entry);
  });
}

/**
 * Reset module-level state between tests.
 * Called automatically by the registry during stopAll via the onCleanup hook.
 */
export function resetAccountActivityMockState(): void {
  for (const waiter of subscriptionWaiters) {
    clearTimeout(waiter.timer);
  }
  subscriptionWaiters = [];
}

const DEFAULT_CHAINS_UP = [
  'eip155:1',
  'eip155:10',
  'eip155:56',
  'eip155:137',
  'eip155:143',
  'eip155:534352',
  'eip155:1337',
  'eip155:8453',
  'eip155:42161',
  'eip155:59144',
  'eip155:999',
];

export const DEFAULT_ACCOUNT_ACTIVITY_WS_MOCKS: WebSocketMessageMock[] = [
  {
    messageIncludes: ['unsubscribe'],
    response: {
      event: 'unsubscribed',
      timestamp: Date.now(),
      data: {
        requestId: 'mock-unsubscribe-response',
        succeeded: [],
        failed: [],
      },
    },
    delay: 100,
    logMessage: 'AccountActivity unsubscribe message received from client',
  },
];

/**
 * Sets up AccountActivity WebSocket mocks on a dedicated server.
 *
 * Unlike Solana mocks, this handler dynamically echoes back the client's
 * `requestId` in subscribe/unsubscribe responses (required by BackendWebSocketService
 * for request-response correlation). After each subscribe, a system-notification
 * with chain status "up" is also sent.
 *
 * @param server - The LocalWebSocketServer instance (injected by registry)
 * @param mocks - Per-test mock overrides (merged before defaults)
 * @param options - Configuration for the mock behaviour
 */
async function setupAccountActivityWebsocketMocks(
  server: LocalWebSocketServer,
  mocks: WebSocketMessageMock[] = [],
  options?: Record<string, unknown>,
): Promise<void> {
  const wsServer = server.getServer();

  const chainsUp =
    (options?.chainsUp as string[] | undefined) ?? DEFAULT_CHAINS_UP;

  const mergedMocks: WebSocketMessageMock[] = [
    ...mocks,
    ...DEFAULT_ACCOUNT_ACTIVITY_WS_MOCKS,
  ];

  // Reset module-level state for this test run
  resetAccountActivityMockState();

  let subscriptionCounter = 0;
  let sessionCounter = 0;

  wsServer.on('connection', (socket: WebSocket) => {
    // Send session-created immediately on connection (matches real server)
    sessionCounter += 1;
    const sessionId = `mock-sid-${sessionCounter}`;
    socket.send(
      JSON.stringify({
        event: 'session-created',
        timestamp: Date.now(),
        data: { sessionId },
      }),
    );
    console.log(
      `[AccountActivity Mock] Session created: sessionId=${sessionId}`,
    );

    socket.on('message', (data) => {
      const raw = data.toString();

      let parsed: Record<string, unknown> | undefined;
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        // Not JSON — fall through to string-match mocks
      }

      if (parsed && typeof parsed.event === 'string') {
        const eventType = parsed.event;
        const eventData = (parsed.data ?? {}) as Record<string, unknown>;

        if (eventType === 'subscribe' && eventData.channels) {
          const requestId = eventData.requestId as string;
          const channels = eventData.channels as string[];
          subscriptionCounter += 1;
          const subscriptionId = `mock-sub-${subscriptionCounter}`;

          console.log(
            `[AccountActivity Mock] Subscribe received: channels=${channels.join(', ')}`,
          );

          const subscribeResponse = {
            event: 'subscribed',
            timestamp: Date.now(),
            data: {
              requestId,
              subscriptionId,
              succeeded: channels,
              failed: [],
            },
          };

          setTimeout(() => {
            socket.send(JSON.stringify(subscribeResponse));
            console.log(
              `[AccountActivity Mock] Subscribe response sent: subscriptionId=${subscriptionId}`,
            );

            // Notify any waiters that subscription is established
            const waiters = [...subscriptionWaiters];
            subscriptionWaiters = [];
            for (const waiter of waiters) {
              waiter.resolve(subscriptionId);
            }
          }, 100);

          if (chainsUp.length > 0) {
            const systemNotification = {
              event: 'system-notification',
              channel: 'system-notifications.v1.account-activity.v1',
              data: {
                chainIds: chainsUp,
                status: 'up',
                timestamp: Date.now(),
              },
              timestamp: Date.now(),
            };

            setTimeout(() => {
              socket.send(JSON.stringify(systemNotification));
              console.log(
                `[AccountActivity Mock] System notification sent: ${chainsUp.length} chains up`,
              );
            }, 200);
          }

          return;
        }

        if (eventType === 'unsubscribe' && eventData.subscription) {
          const requestId = eventData.requestId as string;
          const channels = (eventData.channels ?? []) as string[];

          console.log(
            `[AccountActivity Mock] Unsubscribe received: subscription=${eventData.subscription as string}`,
          );

          const unsubscribeResponse = {
            event: 'unsubscribed',
            timestamp: Date.now(),
            data: {
              requestId,
              succeeded: channels,
              failed: [],
            },
          };

          setTimeout(() => {
            socket.send(JSON.stringify(unsubscribeResponse));
            console.log('[AccountActivity Mock] Unsubscribe response sent');
          }, 100);

          return;
        }
      }

      for (const mock of mergedMocks) {
        const includes = Array.isArray(mock.messageIncludes)
          ? mock.messageIncludes
          : [mock.messageIncludes];

        const matches = includes.every((includeStr) =>
          raw.includes(includeStr),
        );

        if (matches) {
          if (mock.logMessage) {
            console.log(mock.logMessage);
          }

          const delay = mock.delay ?? 500;
          setTimeout(() => {
            const payload =
              typeof mock.response === 'function'
                ? mock.response()
                : mock.response;
            socket.send(JSON.stringify(payload));
            console.log(
              `[AccountActivity Mock] Fallback mock sent for: ${includes.join(' + ')}`,
            );
          }, delay);

          break;
        }
      }
    });
  });
}

/**
 * Creates a balance-update notification to push from tests via
 * `WebSocketRegistry.getServer('accountActivity').sendMessage(JSON.stringify(notification))`.
 *
 * @param options - Notification fields
 * @param options.subscriptionId - The subscription ID from subscribe response
 * @param options.channel - Full channel name
 * @param options.address - The account address
 * @param options.chain - CAIP-2 chain ID
 * @param options.updates - Balance updates array
 * @returns The notification message object
 */
export function createBalanceUpdateNotification(options: {
  subscriptionId: string;
  channel: string;
  address: string;
  chain: string;
  updates: {
    asset: {
      fungible: boolean;
      type: string;
      unit: string;
      decimals: number;
    };
    postBalance: { amount: string };
    transfers: { from: string; to: string; amount: string }[];
  }[];
}): Record<string, unknown> {
  return {
    event: 'data',
    subscriptionId: options.subscriptionId,
    channel: options.channel,
    data: {
      address: options.address,
      tx: {
        id: `0x${Date.now().toString(16)}`,
        chain: options.chain,
        status: 'confirmed',
        timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
        from: '0x0000000000000000000000000000000000000000',
        to: options.address,
      },
      updates: options.updates,
    },
    timestamp: Date.now(),
  };
}

export const accountActivityWebSocketConfig: WebSocketServiceConfig = {
  name: WEBSOCKET_SERVICES.accountActivity,
  port: ACCOUNT_ACTIVITY_WS_PORT,
  setup: setupAccountActivityWebsocketMocks,
  onCleanup: resetAccountActivityMockState,
};
