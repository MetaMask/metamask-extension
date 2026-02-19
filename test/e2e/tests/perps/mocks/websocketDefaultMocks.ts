/**
 * Configuration for a WebSocket message mock.
 *
 * Hyperliquid WS messages are JSON strings (client -> server), and responses are
 * JSON objects (server -> client) that we stringify before sending.
 */
export type WebSocketMessageMock = {
  /** String(s) that the message should include to trigger this mock */
  messageIncludes: string | string[];
  /** The JSON response to send back */
  response: object;
  /** Delay before sending the response (in milliseconds) */
  delay?: number;
  /** Custom log message for this mock */
  logMessage?: string;
};

/**
 * Default Hyperliquid WebSocket mocks.
 *
 * These are intentionally minimal: they only cover establishing a connection
 * and a basic subscription flow used by the first Perps E2E test.
 */
export const DEFAULT_HYPERLIQUID_WS_MOCKS: WebSocketMessageMock[] = [
  {
    messageIncludes: ['"method":"subscribe"', '"type":"allMids"'],
    response: {
      channel: 'allMids',
      data: {
        mids: {
          BTC: '45250.00',
          ETH: '3025.50',
          SOL: '97.25',
        },
      },
    },
    delay: 50,
    logMessage: 'Hyperliquid allMids subscribe message received from client',
  },
  {
    messageIncludes: '"method":"ping"',
    response: {
      channel: 'pong',
    },
    delay: 10,
    logMessage: 'Hyperliquid ping message received from client',
  },
];
