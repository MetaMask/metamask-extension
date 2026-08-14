/**
 * WebSocket mock helpers for Perps Activity E2E tests.
 *
 * These mocks override the HyperLiquid subscription responses to inject
 * pre-populated activity data (fills, orders, funding, deposits) so the
 * Perps Activity page can be tested without placing real orders.
 *
 * Usage — pass as `perpsWebSocketSpecificMocks` in withFixtures:
 * ```ts
 * await withFixtures({
 *   ...getPerpsConfigEligible(this.test?.fullTitle()),
 *   perpsWebSocketSpecificMocks: WS_WITH_ACTIVITY_DATA,
 * }, ...)
 * ```
 */

import type { WebSocketMessageMock } from '../../../websocket/types';
import {
  buildSubscribedConfirmation,
  buildWsPostResponse,
  parseWsPost,
} from './websocketDefaultMocks';

export const WS_MOCK_DEFAULT_USER =
  '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

const MOCK_FILL_HASH =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

const MOCK_ORDER_HASH =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

const MOCK_DEPOSIT_HASH =
  '0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678';

const NOW = Date.now();

/**
 * A single ETH "Open Long" fill at $3,000.
 * Produces a 'trade' transaction on the activity page.
 */
export const MOCK_ETH_OPEN_LONG_FILL = {
  coin: 'ETH',
  px: '3000.00',
  sz: '2.5',
  side: 'B',
  time: NOW - 3600000, // 1 hour ago
  startPosition: '0.0',
  dir: 'Open Long',
  closedPnl: '0.0',
  hash: MOCK_FILL_HASH,
  oid: 88810,
  crossed: true,
  fee: '7.50',
  tid: 88811,
  feeToken: 'USDC',
  liquidation: false,
  builderFee: '0',
  twapId: null,
};

/**
 * A single open ETH limit-buy order at $3,100.
 * Produces an 'order' transaction on the activity page.
 */
export const MOCK_ETH_LIMIT_ORDER = {
  coin: 'ETH',
  side: 'B',
  limitPx: '3100.00',
  sz: '1.0',
  oid: 99901,
  timestamp: NOW - 1800000, // 30 min ago
  origSz: '1.0',
  orderType: 'Limit',
  triggerCondition: 'N/A',
  isTrigger: false,
  triggerPx: '0',
  children: [],
  isPositionTpsl: false,
  reduceOnly: false,
  limitPxHex: null,
  cloid: null,
};

/**
 * A single ETH funding payment.
 * Produces a 'funding' transaction on the activity page.
 *
 * Format matches the HyperLiquid `userFunding` API response:
 * the funding data is nested inside a `delta` object.
 */
export const MOCK_ETH_FUNDING = {
  time: NOW - 7200000, // 2 hours ago
  hash: MOCK_ORDER_HASH,
  delta: {
    type: 'funding',
    coin: 'ETH',
    usdc: '-2.50',
    szi: '2.5',
    fundingRate: '0.0001',
    nSamples: 1,
  },
};

/**
 * A single USDC deposit ledger update.
 * Produces a 'deposit' transaction on the activity page.
 */
export const MOCK_USDC_DEPOSIT = {
  time: NOW - 86400000, // 1 day ago
  hash: MOCK_DEPOSIT_HASH,
  delta: {
    type: 'deposit',
    amount: '1000.0',
    nonce: 1,
    usdc: '1000.0',
  },
};

/**
 * Funded clearing-house state with 10 000 USDC, no open positions.
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
 * WebSocket mocks that pre-populate all four activity types:
 * - Trades: via `userFills` subscription follow-up
 * - Orders: via `openOrders` subscription follow-up
 * - Funding: via `webData2.userFundings` and WS POST
 * - Deposits: via `webData2.userNonFundingLedgerUpdates` and WS POST
 *
 * Use with `perpsWebSocketSpecificMocks` to test activity filter scenarios.
 */
export const WS_WITH_ACTIVITY_DATA: WebSocketMessageMock[] = [
  {
    // clearinghouseState (HIP-3): funded account, no positions
    messageIncludes: ['"method":"subscribe"', '"type":"clearinghouseState"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'clearinghouseState',
      data: {
        clearinghouseState: FUNDED_CLEARING_HOUSE_STATE,
        dex: '',
        user: WS_MOCK_DEFAULT_USER,
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Activity mock: clearinghouseState with funded account',
  },
  {
    // webData2: delivers fills + openOrders + funding + deposits in one shot
    messageIncludes: ['"method":"subscribe"', '"type":"webData2"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'webData2',
      data: {
        clearinghouseState: FUNDED_CLEARING_HOUSE_STATE,
        openOrders: [MOCK_ETH_LIMIT_ORDER],
        frontendOpenOrders: [],
        fills: [MOCK_ETH_OPEN_LONG_FILL],
        userFundings: [MOCK_ETH_FUNDING],
        userNonFundingLedgerUpdates: [MOCK_USDC_DEPOSIT],
        serverTime: NOW,
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage:
      'Activity mock: webData2 with fills + orders + funding + deposits',
  },
  {
    // userFills subscription: deliver the open-long fill as a snapshot
    messageIncludes: ['"method":"subscribe"', '"type":"userFills"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'userFills',
      data: {
        user: WS_MOCK_DEFAULT_USER,
        isSnapshot: true,
        fills: [MOCK_ETH_OPEN_LONG_FILL],
      },
    },
    followUpDelay: 100,
    delay: 50,
    logMessage: 'Activity mock: userFills snapshot with ETH open-long fill',
  },
  {
    // openOrders subscription (HIP-3): deliver the limit order
    messageIncludes: ['"method":"subscribe"', '"type":"openOrders"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'openOrders',
      data: [MOCK_ETH_LIMIT_ORDER],
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Activity mock: openOrders subscription with ETH limit order',
  },
  {
    // webData3 (HIP-3 multi-DEX): include same data so HIP-3 mode is covered
    messageIncludes: ['"method":"subscribe"', '"type":"webData3"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'webData3',
      data: {
        perpDexStates: [
          {
            clearinghouseState: FUNDED_CLEARING_HOUSE_STATE,
            openOrders: [MOCK_ETH_LIMIT_ORDER],
            frontendOpenOrders: [],
            fills: [MOCK_ETH_OPEN_LONG_FILL],
            userFundings: [MOCK_ETH_FUNDING],
            userNonFundingLedgerUpdates: [MOCK_USDC_DEPOSIT],
            serverTime: NOW,
            perpsAtOpenInterestCap: [],
          },
        ],
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Activity mock: webData3 with all activity types',
  },
  {
    // WS POST for userFills: return the fill snapshot
    messageIncludes: ['"method":"post"', '"type":"userFills"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, [MOCK_ETH_OPEN_LONG_FILL])
        : null;
    },
    delay: 50,
    logMessage: 'Activity mock: WS POST userFills',
  },
  {
    // WS POST for historicalOrders: return the limit order.
    // getOrders() in the provider calls infoClient.historicalOrders() which sends
    // a WS POST with type "historicalOrders". The response must be wrapped in
    // { order, status, statusTimestamp } as required by the provider's transform.
    messageIncludes: ['"method":"post"', '"type":"historicalOrders"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, [
            {
              order: MOCK_ETH_LIMIT_ORDER,
              status: 'open',
              statusTimestamp: MOCK_ETH_LIMIT_ORDER.timestamp,
            },
          ])
        : null;
    },
    delay: 50,
    logMessage: 'Activity mock: WS POST historicalOrders',
  },
  {
    // WS POST for userFunding: return the funding entry
    messageIncludes: ['"method":"post"', '"type":"userFunding"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, [MOCK_ETH_FUNDING])
        : null;
    },
    delay: 50,
    logMessage: 'Activity mock: WS POST userFunding',
  },
  {
    // WS POST for userNonFundingLedgerUpdates: return the deposit
    messageIncludes: [
      '"method":"post"',
      '"type":"userNonFundingLedgerUpdates"',
    ],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, [MOCK_USDC_DEPOSIT])
        : null;
    },
    delay: 50,
    logMessage: 'Activity mock: WS POST userNonFundingLedgerUpdates',
  },
];

/**
 * WebSocket mocks delivering only a funded account with an open ETH long fill.
 * Use for tests that only need trade-type activity.
 */
export const WS_WITH_TRADE_ACTIVITY: WebSocketMessageMock[] = [
  {
    messageIncludes: ['"method":"subscribe"', '"type":"clearinghouseState"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'clearinghouseState',
      data: {
        clearinghouseState: FUNDED_CLEARING_HOUSE_STATE,
        dex: '',
        user: WS_MOCK_DEFAULT_USER,
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Trade-activity mock: clearinghouseState',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"userFills"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'userFills',
      data: {
        user: WS_MOCK_DEFAULT_USER,
        isSnapshot: true,
        fills: [MOCK_ETH_OPEN_LONG_FILL],
      },
    },
    followUpDelay: 100,
    delay: 50,
    logMessage: 'Trade-activity mock: userFills snapshot',
  },
  {
    messageIncludes: ['"method":"post"', '"type":"userFills"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, [MOCK_ETH_OPEN_LONG_FILL])
        : null;
    },
    delay: 50,
    logMessage: 'Trade-activity mock: WS POST userFills',
  },
];
