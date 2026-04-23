/**
 * WebSocket mock helpers for Perps E2E tests that require pre-existing positions.
 *
 * These mocks override the default `user` subscription response (which returns
 * empty positions) with data that simulates a user who already has open positions.
 *
 * Usage — pass as `perpsWebSocketSpecificMocks` in withFixtures:
 * ```ts
 * await withFixtures({
 *   ...getPerpsConfigEligible(this.test?.fullTitle()),
 *   perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG,
 * }, ...)
 * ```
 *
 * NOTE: The `positions` array format inside the `user` channel response must match
 * what @metamask/perps-controller expects from the Hyperliquid WebSocket API.
 * The structures below use the internal Position schema observed in
 * ui/components/app/perps/mocks.ts. Verify against the running controller
 * (PERPS_ENABLED=true build) if the UI does not show the expected position data.
 */

import type { WebSocketMessageMock } from '../../../websocket/types';
import {
  buildSubscribedConfirmation,
  buildWsPostResponse,
  parseWsPost,
} from './websocketDefaultMocks';

/**
 * A single ETH long position (2.5 ETH, 3x isolated, entry $2850).
 * Use for tests that need an open long to test Close, Reverse, or TP/SL update.
 */
export const WS_USER_WITH_ETH_LONG: WebSocketMessageMock[] = [
  {
    messageIncludes: ['"method":"subscribe"', '"type":"user"'],
    response: () => ({
      channel: 'user',
      data: {
        positions: [
          {
            symbol: 'ETH',
            size: '2.5',
            entryPrice: '2850.00',
            positionValue: '7125.00',
            unrealizedPnl: '375.00',
            marginUsed: '2375.00',
            leverage: { type: 'isolated', value: 3, rawUsd: '2375.00' },
            liquidationPrice: '2400.00',
            maxLeverage: 20,
            returnOnEquity: '0.1579',
            cumulativeFunding: {
              allTime: '12.50',
              sinceOpen: '8.30',
              sinceChange: '0.00',
            },
            takeProfitPrice: undefined,
            stopLossPrice: undefined,
            takeProfitCount: 0,
            stopLossCount: 0,
          },
        ],
        balances: [{ coin: 'USDC', hold: '2375.00', total: '12500.00' }],
        accountValue: '12875.00',
        totalMarginUsed: '2375.00',
        totalNtlPos: '7125.00',
        totalRawUsd: '12875.00',
      },
      time: Date.now(),
    }),
    delay: 100,
    logMessage: 'Perps user mock: ETH long position (2.5 ETH, 3x isolated)',
  },
];

/**
 * A single BTC short position (-0.5 BTC, 15x cross, entry $45000).
 * Use for tests that need an open short to test Reverse or partial close.
 */
export const WS_USER_WITH_BTC_SHORT: WebSocketMessageMock[] = [
  {
    messageIncludes: ['"method":"subscribe"', '"type":"user"'],
    response: () => ({
      channel: 'user',
      data: {
        positions: [
          {
            symbol: 'BTC',
            size: '-0.5',
            entryPrice: '45000.00',
            positionValue: '22500.00',
            unrealizedPnl: '-250.00',
            marginUsed: '1500.00',
            leverage: { type: 'cross', value: 15 },
            liquidationPrice: '48000.00',
            maxLeverage: 20,
            returnOnEquity: '-0.1667',
            cumulativeFunding: {
              allTime: '-5.20',
              sinceOpen: '-3.10',
              sinceChange: '0.00',
            },
            takeProfitPrice: undefined,
            stopLossPrice: '47000.00',
            takeProfitCount: 0,
            stopLossCount: 1,
          },
        ],
        balances: [{ coin: 'USDC', hold: '1500.00', total: '11000.00' }],
        accountValue: '10750.00',
        totalMarginUsed: '1500.00',
        totalNtlPos: '22500.00',
        totalRawUsd: '10750.00',
      },
      time: Date.now(),
    }),
    delay: 100,
    logMessage: 'Perps user mock: BTC short position (-0.5 BTC, 15x cross)',
  },
];

/**
 * Funded clearing-house state with 10 000 USDC, no open positions.
 * Use for tests that need to place a new order (open long/short) without
 * pre-existing positions.
 */
const FUNDED_CLEARING_HOUSE_STATE = {
  marginSummary: {
    accountValue: '10000.0',
    totalNtlPos: '0.0',
    totalRawUsd: '10000.0',
    totalMarginUsed: '0.0',
    withdrawable: '10000.0',
    totalVaultEquity: '0.0',
  },
  crossMarginSummary: {
    accountValue: '10000.0',
    totalNtlPos: '0.0',
    totalRawUsd: '10000.0',
    totalMarginUsed: '0.0',
    withdrawable: '10000.0',
    totalVaultEquity: '0.0',
  },
  crossMaintenanceMarginUsed: '0.0',
  withdrawable: '10000.0',
  assetPositions: [],
  time: 0,
};

/**
 * Clearing-house state with an open ETH long position (2.5 ETH, 3x isolated, entry $2850).
 * accountValue = initial 10 000 + 375 unrealizedPnl = 10 375.
 */
const ETH_LONG_CLEARING_HOUSE_STATE = {
  ...FUNDED_CLEARING_HOUSE_STATE,
  marginSummary: {
    ...FUNDED_CLEARING_HOUSE_STATE.marginSummary,
    accountValue: '12875.0',
    totalNtlPos: '7125.0',
    totalMarginUsed: '2375.0',
    withdrawable: '10500.0',
  },
  crossMarginSummary: {
    ...FUNDED_CLEARING_HOUSE_STATE.crossMarginSummary,
    accountValue: '12875.0',
    totalNtlPos: '7125.0',
    totalMarginUsed: '2375.0',
    withdrawable: '10500.0',
  },
  withdrawable: '10500.0',
  assetPositions: [
    {
      position: {
        coin: 'ETH',
        szi: '2.5',
        leverage: { type: 'isolated', value: 3, rawUsd: '2375.0' },
        entryPx: '2850.00',
        positionValue: '7125.0',
        unrealizedPnl: '375.0',
        returnOnEquity: '0.1579',
        liquidationPx: '2400.00',
        marginUsed: '2375.0',
        maxTradeSzs: ['100', '100'],
        cumFunding: {
          allTime: '12.50',
          sinceOpen: '8.30',
          sinceChange: '0.0',
        },
      },
      type: 'oneWay',
    },
  ],
  time: 0,
};

/**
 * Account with an open ETH long position (HIP-3 compatible).
 *
 * Provides clearinghouseState, webData2, and webData3 subscription mocks
 * with the ETH long position so the controller populates positions correctly.
 */
export const WS_USER_WITH_ETH_LONG_POSITION: WebSocketMessageMock[] = [
  {
    messageIncludes: ['"method":"subscribe"', '"type":"clearinghouseState"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'clearinghouseState',
      data: {
        clearinghouseState: ETH_LONG_CLEARING_HOUSE_STATE,
        dex: '',
        user: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage:
      'Perps ETH long mock: clearinghouseState subscription with ETH position',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"webData2"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'webData2',
      data: {
        clearinghouseState: ETH_LONG_CLEARING_HOUSE_STATE,
        openOrders: [],
        frontendOpenOrders: [],
        fills: [],
        userFundings: [],
        userNonFundingLedgerUpdates: [],
        serverTime: 0,
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Perps ETH long mock: webData2 with ETH position',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"webData3"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'webData3',
      data: {
        perpDexStates: [
          {
            clearinghouseState: ETH_LONG_CLEARING_HOUSE_STATE,
            openOrders: [],
            frontendOpenOrders: [],
            fills: [],
            userFundings: [],
            userNonFundingLedgerUpdates: [],
            serverTime: 0,
            perpsAtOpenInterestCap: [],
          },
        ],
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Perps ETH long mock: webData3 with ETH position',
  },
  {
    messageIncludes: ['"method":"post"', '"type":"clearinghouseState"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(
            req.id,
            req.type,
            ETH_LONG_CLEARING_HOUSE_STATE,
          )
        : null;
    },
    delay: 50,
    logMessage: 'Perps ETH long mock: clearinghouseState POST with ETH position',
  },
];

/**
 * Funded account with 10 000 USDC and no open positions.
 *
 * With fallbackHip3Enabled=true the controller uses individual
 * `clearinghouseState` and `openOrders` subscriptions (not webData2).
 * This mock overrides:
 *  - clearinghouseState subscription → funded follow-up data
 *  - clearinghouseState WS POST     → funded response
 *  - webData2 subscription           → funded follow-up (fallback path)
 *  - webData3 subscription           → funded perpDexStates (HIP-3 OI caps)
 */
export const WS_USER_WITH_FUNDED_ACCOUNT: WebSocketMessageMock[] = [
  {
    messageIncludes: ['"method":"subscribe"', '"type":"clearinghouseState"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'clearinghouseState',
      data: {
        clearinghouseState: FUNDED_CLEARING_HOUSE_STATE,
        dex: '',
        user: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage:
      'Perps funded account mock: clearinghouseState subscription with 10000 USDC',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"webData2"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'webData2',
      data: {
        clearinghouseState: FUNDED_CLEARING_HOUSE_STATE,
        openOrders: [],
        frontendOpenOrders: [],
        fills: [],
        userFundings: [],
        userNonFundingLedgerUpdates: [],
        serverTime: 0,
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage:
      'Perps funded account mock: webData2 with 10000 USDC balance',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"webData3"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'webData3',
      data: {
        perpDexStates: [
          {
            clearinghouseState: FUNDED_CLEARING_HOUSE_STATE,
            openOrders: [],
            frontendOpenOrders: [],
            fills: [],
            userFundings: [],
            userNonFundingLedgerUpdates: [],
            serverTime: 0,
            perpsAtOpenInterestCap: [],
          },
        ],
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage:
      'Perps funded account mock: webData3 with 10000 USDC balance',
  },
  {
    messageIncludes: ['"method":"post"', '"type":"clearinghouseState"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, FUNDED_CLEARING_HOUSE_STATE)
        : null;
    },
    delay: 50,
    logMessage:
      'Perps funded account mock: clearinghouseState POST with 10000 USDC',
  },
];

/**
 * Pushes an updated clearinghouseState with a new position through the
 * Perps WebSocket server.  Use after submitting an order to simulate the
 * real-time subscription update that HyperLiquid would send.
 *
 * @param server - The LocalWebSocketServer for the perps service
 *                 (e.g. `WebSocketRegistry.getServer('perps')`)
 * @param opts   - Position parameters
 */
export function pushPositionUpdate(
  server: { sendMessage: (msg: string) => void },
  opts: {
    user?: string;
    coin: string;
    szi: string;
    entryPx: string;
    leverage: number;
    positionValue: string;
    accountValue: string;
    totalMarginUsed: string;
    withdrawable: string;
  },
): void {
  const stateWithPosition = {
    ...FUNDED_CLEARING_HOUSE_STATE,
    marginSummary: {
      ...FUNDED_CLEARING_HOUSE_STATE.marginSummary,
      accountValue: opts.accountValue,
      totalNtlPos: opts.positionValue,
      totalMarginUsed: opts.totalMarginUsed,
      withdrawable: opts.withdrawable,
    },
    crossMarginSummary: {
      ...FUNDED_CLEARING_HOUSE_STATE.crossMarginSummary,
      accountValue: opts.accountValue,
      totalNtlPos: opts.positionValue,
      totalMarginUsed: opts.totalMarginUsed,
      withdrawable: opts.withdrawable,
    },
    assetPositions: [
      {
        position: {
          coin: opts.coin,
          szi: opts.szi,
          leverage: {
            type: 'isolated',
            value: opts.leverage,
            rawUsd: opts.totalMarginUsed,
          },
          entryPx: opts.entryPx,
          positionValue: opts.positionValue,
          unrealizedPnl: '0.0',
          returnOnEquity: '0.0',
          liquidationPx: null,
          marginUsed: opts.totalMarginUsed,
          maxTradeSzs: ['100', '100'],
          cumFunding: { allTime: '0.0', sinceOpen: '0.0', sinceChange: '0.0' },
        },
        type: 'oneWay',
      },
    ],
    time: Date.now(),
  };

  const user =
    opts.user ?? '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

  server.sendMessage(
    JSON.stringify({
      channel: 'clearinghouseState',
      data: { clearinghouseState: stateWithPosition, dex: '', user },
    }),
  );
}

/**
 * Pushes a clearinghouseState with zero positions through the Perps
 * WebSocket server.  Use after closing a position to simulate the
 * real-time subscription update that HyperLiquid would send.
 *
 * @param server - The LocalWebSocketServer for the perps service
 * @param opts   - Optional account values after close
 */
export function pushPositionClosed(
  server: { sendMessage: (msg: string) => void },
  opts?: {
    user?: string;
    accountValue?: string;
    withdrawable?: string;
  },
): void {
  const user =
    opts?.user ?? '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
  const accountValue = opts?.accountValue ?? '10000.0';
  const withdrawable = opts?.withdrawable ?? '10000.0';

  const emptyState = {
    ...FUNDED_CLEARING_HOUSE_STATE,
    marginSummary: {
      ...FUNDED_CLEARING_HOUSE_STATE.marginSummary,
      accountValue,
      withdrawable,
    },
    crossMarginSummary: {
      ...FUNDED_CLEARING_HOUSE_STATE.crossMarginSummary,
      accountValue,
      withdrawable,
    },
    withdrawable,
    assetPositions: [],
    time: Date.now(),
  };

  server.sendMessage(
    JSON.stringify({
      channel: 'clearinghouseState',
      data: { clearinghouseState: emptyState, dex: '', user },
    }),
  );
}

/**
 * ETH long with TP and SL already set.
 * Use for tests that need to verify the auto-close row is already displayed,
 * or to test updating existing TP/SL values.
 */
export const WS_USER_WITH_ETH_LONG_AND_TPSL: WebSocketMessageMock[] = [
  {
    messageIncludes: ['"method":"subscribe"', '"type":"user"'],
    response: () => ({
      channel: 'user',
      data: {
        positions: [
          {
            symbol: 'ETH',
            size: '2.5',
            entryPrice: '2850.00',
            positionValue: '7125.00',
            unrealizedPnl: '375.00',
            marginUsed: '2375.00',
            leverage: { type: 'isolated', value: 3, rawUsd: '2375.00' },
            liquidationPrice: '2400.00',
            maxLeverage: 20,
            returnOnEquity: '0.1579',
            cumulativeFunding: {
              allTime: '12.50',
              sinceOpen: '8.30',
              sinceChange: '0.00',
            },
            takeProfitPrice: '3200.00',
            stopLossPrice: '2600.00',
            takeProfitCount: 1,
            stopLossCount: 1,
          },
        ],
        balances: [{ coin: 'USDC', hold: '2375.00', total: '12500.00' }],
        accountValue: '12875.00',
        totalMarginUsed: '2375.00',
        totalNtlPos: '7125.00',
        totalRawUsd: '12875.00',
      },
      time: Date.now(),
    }),
    delay: 100,
    logMessage:
      'Perps user mock: ETH long with TP=$3200 / SL=$2600',
  },
];
