/**
 * WebSocket mock helpers for Perps E2E tests that require pre-existing positions.
 *
 * These mocks override the HIP-3 clearinghouseState/webData2/webData3 subscription
 * responses with data that simulates a user who already has open positions.
 *
 * Usage — pass as `perpsWebSocketSpecificMocks` in withFixtures:
 * ```ts
 * await withFixtures({
 *   ...getPerpsConfigEligible(this.test?.fullTitle()),
 *   perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
 * }, ...)
 * ```
 */

import type { WebSocketMessageMock } from '../../../websocket/types';
import {
  buildSubscribedConfirmation,
  buildWsPostResponse,
  parseWsPost,
} from './websocketDefaultMocks';

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
 *
 * `marginUsed` must exceed notional/leverage (7125/3 = 2375) so the UI allows removing margin
 * (`calculateMaxRemovableMargin` in usePerpsMarginCalculations); otherwise "Available to subtract" is $0.
 */
const ETH_LONG_CLEARING_HOUSE_STATE = {
  ...FUNDED_CLEARING_HOUSE_STATE,
  marginSummary: {
    ...FUNDED_CLEARING_HOUSE_STATE.marginSummary,
    accountValue: '12875.0',
    totalNtlPos: '7125.0',
    totalMarginUsed: '2600.0',
    withdrawable: '10275.0',
  },
  crossMarginSummary: {
    ...FUNDED_CLEARING_HOUSE_STATE.crossMarginSummary,
    accountValue: '12875.0',
    totalNtlPos: '7125.0',
    totalMarginUsed: '2600.0',
    withdrawable: '10275.0',
  },
  withdrawable: '10275.0',
  assetPositions: [
    {
      position: {
        coin: 'ETH',
        szi: '2.5',
        leverage: { type: 'isolated', value: 3, rawUsd: '2600.0' },
        entryPx: '2850.00',
        positionValue: '7125.0',
        unrealizedPnl: '375.0',
        returnOnEquity: '0.1579',
        liquidationPx: '2400.00',
        marginUsed: '2600.0',
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
        ? buildWsPostResponse(req.id, req.type, ETH_LONG_CLEARING_HOUSE_STATE)
        : null;
    },
    delay: 50,
    logMessage:
      'Perps ETH long mock: clearinghouseState POST with ETH position',
  },
];

/**
 * Clearing-house state with an open BTC short (-0.5 BTC, 15x cross, entry $45 000).
 * Aligns with `WS_USER_WITH_BTC_SHORT` for HIP-3 clearinghouse / webData paths.
 */
const BTC_SHORT_CLEARING_HOUSE_STATE = {
  ...FUNDED_CLEARING_HOUSE_STATE,
  marginSummary: {
    ...FUNDED_CLEARING_HOUSE_STATE.marginSummary,
    accountValue: '10750.0',
    totalNtlPos: '22500.0',
    totalMarginUsed: '1500.0',
    withdrawable: '9500.0',
  },
  crossMarginSummary: {
    ...FUNDED_CLEARING_HOUSE_STATE.crossMarginSummary,
    accountValue: '10750.0',
    totalNtlPos: '22500.0',
    totalMarginUsed: '1500.0',
    withdrawable: '9500.0',
  },
  withdrawable: '9500.0',
  assetPositions: [
    {
      position: {
        coin: 'BTC',
        szi: '-0.5',
        leverage: { type: 'cross', value: 15 },
        entryPx: '45000.00',
        positionValue: '22500.0',
        unrealizedPnl: '-250.0',
        returnOnEquity: '-0.1667',
        liquidationPx: '48000.00',
        marginUsed: '1500.0',
        maxTradeSzs: ['100', '100'],
        cumFunding: {
          allTime: '-5.20',
          sinceOpen: '-3.10',
          sinceChange: '0.0',
        },
      },
      type: 'oneWay',
    },
  ],
  time: 0,
};

/**
 * Account with an open BTC short position (HIP-3 compatible).
 *
 * Same subscription / POST coverage as `WS_USER_WITH_ETH_LONG_POSITION`, for BTC short.
 */
export const WS_USER_WITH_BTC_SHORT_POSITION: WebSocketMessageMock[] = [
  {
    messageIncludes: ['"method":"subscribe"', '"type":"clearinghouseState"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'clearinghouseState',
      data: {
        clearinghouseState: BTC_SHORT_CLEARING_HOUSE_STATE,
        dex: '',
        user: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage:
      'Perps BTC short mock: clearinghouseState subscription with BTC position',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"webData2"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'webData2',
      data: {
        clearinghouseState: BTC_SHORT_CLEARING_HOUSE_STATE,
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
    logMessage: 'Perps BTC short mock: webData2 with BTC position',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"webData3"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'webData3',
      data: {
        perpDexStates: [
          {
            clearinghouseState: BTC_SHORT_CLEARING_HOUSE_STATE,
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
    logMessage: 'Perps BTC short mock: webData3 with BTC position',
  },
  {
    messageIncludes: ['"method":"post"', '"type":"clearinghouseState"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, BTC_SHORT_CLEARING_HOUSE_STATE)
        : null;
    },
    delay: 50,
    logMessage:
      'Perps BTC short mock: clearinghouseState POST with BTC position',
  },
];

/**
 * Funded account with 10 000 USDC and no open positions.
 *
 * With fallbackHip3Enabled=true the controller uses individual
 * `clearinghouseState` and `openOrders` subscriptions (not webData2).
 * This mock overrides:
 * - clearinghouseState subscription → funded follow-up data
 * - clearinghouseState WS POST → funded response
 * - webData2 subscription → funded follow-up (fallback path)
 * - webData3 subscription → funded perpDexStates (HIP-3 OI caps)
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
    logMessage: 'Perps funded account mock: webData2 with 10000 USDC balance',
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
    logMessage: 'Perps funded account mock: webData3 with 10000 USDC balance',
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
 * (e.g. `WebSocketRegistry.getServer('perps')`).
 * @param server.sendMessage - Sends a raw JSON string on the perps WS.
 * @param opts - Position parameters
 * @param opts.user
 * @param opts.coin
 * @param opts.szi
 * @param opts.entryPx
 * @param opts.leverage
 * @param opts.positionValue
 * @param opts.accountValue
 * @param opts.totalMarginUsed
 * @param opts.withdrawable
 * @param opts.liquidationPx
 * @param opts.unrealizedPnl
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
    /** Hyperliquid liquidation price string, or null if unknown */
    liquidationPx?: string | null;
    unrealizedPnl?: string;
  },
): void {
  const liquidationPx =
    opts.liquidationPx === undefined ? null : opts.liquidationPx;
  const unrealizedPnl = opts.unrealizedPnl ?? '0.0';

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
          unrealizedPnl,
          returnOnEquity: '0.0',
          liquidationPx,
          marginUsed: opts.totalMarginUsed,
          maxTradeSzs: ['100', '100'],
          cumFunding: { allTime: '0.0', sinceOpen: '0.0', sinceChange: '0.0' },
        },
        type: 'oneWay',
      },
    ],
    time: Date.now(),
  };

  const user = opts.user ?? '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

  // @metamask/perps-controller HyperLiquidSubscriptionService only applies
  // incoming clearinghouseState events when positionSubscriberCount > 0 or
  // accountSubscriberCount > 0 (see createClearinghouseSubscription). During
  // navigation (e.g. order entry unmount → market detail remount) those counts
  // can briefly be zero, so a single broadcast is dropped. Re-send on a short
  // schedule so tests reliably observe the simulated fill after UI re-subscribes.
  const broadcast = () => {
    server.sendMessage(
      JSON.stringify({
        channel: 'clearinghouseState',
        data: {
          clearinghouseState: { ...stateWithPosition, time: Date.now() },
          dex: '',
          user,
        },
      }),
    );
  };
  broadcast();
  setTimeout(broadcast, 200);
  setTimeout(broadcast, 600);
  setTimeout(broadcast, 1400);
}

/**
 * Pushes a clearinghouseState with zero positions through the Perps
 * WebSocket server.  Use after closing a position to simulate the
 * real-time subscription update that HyperLiquid would send.
 *
 * @param server - The LocalWebSocketServer for the perps service.
 * @param server.sendMessage - Sends a raw JSON string on the perps WS.
 * @param opts - Optional account values after close
 * @param opts.user
 * @param opts.accountValue
 * @param opts.withdrawable
 */
export function pushPositionClosed(
  server: { sendMessage: (msg: string) => void },
  opts?: {
    user?: string;
    accountValue?: string;
    withdrawable?: string;
  },
): void {
  const user = opts?.user ?? '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
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

  const broadcast = () => {
    server.sendMessage(
      JSON.stringify({
        channel: 'clearinghouseState',
        data: {
          clearinghouseState: { ...emptyState, time: Date.now() },
          dex: '',
          user,
        },
      }),
    );
  };
  broadcast();
  setTimeout(broadcast, 200);
  setTimeout(broadcast, 600);
  setTimeout(broadcast, 1400);
}

const WS_MOCK_DEFAULT_USER = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

const MOCK_L1_FILL_HASH = `0x${'b'.repeat(64)}`;

export type PushUserFillsClosePositionSnapshotOpts = {
  user?: string;
  coin: string;
  px: string;
  sz: string;
  /** Hyperliquid wire side: `"A"` = sell, `"B"` = buy */
  side: 'A' | 'B';
  /** e.g. `"Close Long"`, `"Close Short"` */
  dir: string;
  /** Position size before the fill (decimal string; may be negative for shorts). */
  startPosition: string;
  oid?: number;
  tid?: number;
};

/**
 * Pushes a `userFills` WebSocket snapshot so the Hyperliquid subscription client
 * delivers an `OrderFill[]` payload to the UI (same path as production fills).
 * Use after a simulated close (full or partial) to assert Activity / Recent activity.
 *
 * Shape matches `@nktkas/hyperliquid` `UserFillsEvent` (user + fills + isSnapshot).
 *
 * @param server - The LocalWebSocketServer for the perps service
 * @param server.sendMessage
 * @param opts - Wire fill fields for one close (or partial-close) fill
 */
export function pushUserFillsClosePositionSnapshot(
  server: { sendMessage: (msg: string) => void },
  opts: PushUserFillsClosePositionSnapshotOpts,
): void {
  const user = opts.user ?? WS_MOCK_DEFAULT_USER;
  const now = Date.now();
  const oid = opts.oid ?? 8_881_001;
  const tid = opts.tid ?? 8_881_002;

  const fill = {
    coin: opts.coin,
    px: opts.px,
    sz: opts.sz,
    side: opts.side,
    time: now,
    startPosition: opts.startPosition,
    dir: opts.dir,
    closedPnl: '12.50',
    hash: MOCK_L1_FILL_HASH,
    oid,
    crossed: true,
    fee: '1.25',
    tid,
    feeToken: 'USDC',
    twapId: null,
  };

  server.sendMessage(
    JSON.stringify({
      channel: 'userFills',
      data: {
        user,
        isSnapshot: true,
        fills: [fill],
      },
    }),
  );
}
