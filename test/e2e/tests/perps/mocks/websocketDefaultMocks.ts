/**
 * Configuration for a Perps WebSocket message mock.
 */
export type PerpsWebSocketMessageMock = {
  /** String(s) that the message should include to trigger this mock */
  messageIncludes: string | string[];
  /** The JSON response to send back */
  response: Record<string, unknown>;
  /** Delay before sending the response (in milliseconds) */
  delay?: number;
  /** Custom log message for this mock */
  logMessage?: string;
};

export const DEFAULT_PERPS_WS_MOCKS: PerpsWebSocketMessageMock[] = [
  {
    messageIncludes: ['"method":"subscribe"', '"allMids"'],
    response: {
      channel: 'allMids',
      data: {
        mids: {
          BTC: '68000.0',
          ETH: '3200.0',
          SOL: '150.0',
        },
      },
    },
    delay: 250,
    logMessage: 'Perps allMids subscription message received from client',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"activeAssetCtx"'],
    response: {
      channel: 'activeAssetCtx',
      data: {
        coin: 'ETH',
        ctx: {
          funding: '0.000100',
          markPx: '3200.00',
          openInterest: '1200000',
          oraclePx: '3198.50',
          premium: '0.000300',
          prevDayPx: '3150.00',
        },
      },
    },
    delay: 250,
    logMessage:
      'Perps activeAssetCtx subscription message received from client',
  },
];
