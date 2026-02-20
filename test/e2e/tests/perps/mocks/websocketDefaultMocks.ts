/**
 * Default WebSocket mocks for Hyperliquid Perps E2E tests.
 *
 * Hyperliquid WebSocket API uses JSON messages. Common subscription types:
 * - l2Book: Order book updates
 * - trades: Trade updates
 * - user: User account/positions
 * - userFills: User order fills
 * - userEvents: User events (orders, etc.)
 * - allMids: Mid prices for all assets
 *
 * @see Hyperliquid API docs for message formats
 */

export type WebSocketMessageMock = {
  /** String(s) that the message should include to trigger this mock */
  messageIncludes: string | string[];
  /** The JSON response to send back, or a getter called at send time (e.g. for fresh timestamps) */
  response: object | (() => object);
  /** Delay before sending the response (in milliseconds) */
  delay?: number;
  /** Custom log message for this mock */
  logMessage?: string;
};

/** Returns the response payload, evaluating getters at send time so timestamps are fresh. */
export function getResponsePayload(mock: WebSocketMessageMock): object {
  return typeof mock.response === 'function' ? mock.response() : mock.response;
}

export const DEFAULT_HYPERLIQUID_WS_MOCKS: WebSocketMessageMock[] = [
  {
    messageIncludes: ['"method":"subscribe"', '"type":"l2Book"'],
    response: () => {
      const now = Date.now();
      return {
        channel: 'l2Book',
        data: {
          coin: 'BTC',
          levels: [[['50000', '1.5'], ['49999', '2.0']], [['50001', '1.2']]],
          time: now,
        },
      };
    },
    delay: 100,
    logMessage: 'Hyperliquid l2Book subscribe message received',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"trades"'],
    response: () => ({
      channel: 'trades',
      data: [],
      time: Date.now(),
    }),
    delay: 100,
    logMessage: 'Hyperliquid trades subscribe message received',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"user"'],
    response: () => ({
      channel: 'user',
      data: {
        balances: [],
        positions: [],
        accountValue: '0',
        totalMarginUsed: '0',
        totalNtlPos: '0',
        totalRawUsd: '0',
      },
      time: Date.now(),
    }),
    delay: 100,
    logMessage: 'Hyperliquid user subscribe message received',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"userFills"'],
    response: () => ({
      channel: 'userFills',
      data: [],
      time: Date.now(),
    }),
    delay: 100,
    logMessage: 'Hyperliquid userFills subscribe message received',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"userEvents"'],
    response: () => ({
      channel: 'userEvents',
      data: [],
      time: Date.now(),
    }),
    delay: 100,
    logMessage: 'Hyperliquid userEvents subscribe message received',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"allMids"'],
    response: () => {
      const now = Date.now();
      return {
        channel: 'allMids',
        data: { mids: {}, time: now },
        time: now,
      };
    },
    delay: 100,
    logMessage: 'Hyperliquid allMids subscribe message received',
  },
  {
    messageIncludes: 'subscribe',
    response: () => ({
      channel: 'subscribed',
      data: { success: true },
      time: Date.now(),
    }),
    delay: 100,
    logMessage: 'Hyperliquid generic subscribe message received',
  },
];
