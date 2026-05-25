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

import type { WebSocketMessageMock } from '../../../websocket/types';

export function getResponsePayload(mock: WebSocketMessageMock): object | null {
  if (!mock.response) {
    return null;
  }
  return typeof mock.response === 'function' ? mock.response() : mock.response;
}

/**
 * Builds a subscription confirmation that echoes the parsed subscribe payload back as `data`.
 *
 * The @nktkas/hyperliquid SDK's WebSocketSubscriptionManager awaits a `subscriptionResponse`
 * event and checks isSubset(subscriptionPayload, responseData). Sending back the original
 * message as `data` satisfies that check regardless of subscription type.
 *
 * @param message - The raw WebSocket message string to echo back.
 * @returns The subscription confirmation object, or a fallback with empty data.
 */
export function buildSubscribedConfirmation(message: string): object | null {
  try {
    const parsed = JSON.parse(message);
    return { channel: 'subscribed', data: parsed };
  } catch {
    return { channel: 'subscribed', data: {} };
  }
}

/**
 * Minimal empty clearing-house state used as the webData2 follow-up so that
 * positions/orders/account channels mark as loaded without waiting for the 3s
 * REST fallback or the 10s WS POST timeout.
 */
const EMPTY_CLEARING_HOUSE_STATE = {
  marginSummary: {
    accountValue: '0.0',
    totalNtlPos: '0.0',
    totalRawUsd: '0.0',
    totalMarginUsed: '0.0',
    withdrawable: '0.0',
    totalVaultEquity: '0.0',
  },
  crossMarginSummary: {
    accountValue: '0.0',
    totalNtlPos: '0.0',
    totalRawUsd: '0.0',
    totalMarginUsed: '0.0',
    withdrawable: '0.0',
    totalVaultEquity: '0.0',
  },
  crossMaintenanceMarginUsed: '0.0',
  withdrawable: '0.0',
  assetPositions: [],
  time: 0,
};

/**
 * Wraps an info-type payload for a WS POST response.
 *
 * The @nktkas/hyperliquid SDK expects the `data.response` field to be:
 * `{ type: "info", payload: { type: <requestType>, data: <actualData> } }`
 *
 * Without this wrapper the SDK resolves `response.payload` which is
 * `undefined`, causing downstream "Cannot read properties of undefined" errors.
 *
 * @param id - The request id echoed back.
 * @param requestType - The original request type (e.g. "clearinghouseState").
 * @param responseData - The actual payload data.
 * @returns The fully wrapped WS POST response envelope.
 */
export function buildWsPostResponse(
  id: number,
  requestType: string,
  responseData: unknown,
) {
  return {
    channel: 'post',
    data: {
      id,
      response: {
        type: 'info',
        payload: { type: requestType, data: responseData },
      },
    },
  };
}

/**
 * Parses a raw WS POST message to extract the `id` and request `type`.
 *
 * @param message - Raw WebSocket message string.
 * @returns Parsed id and type, or null if parsing fails.
 */
export function parseWsPost(
  message: string,
): { id: number; type: string; req?: Record<string, unknown> } | null {
  try {
    const parsed = JSON.parse(message);
    return {
      id: parsed.id,
      type: parsed.request?.payload?.type ?? '',
      req: parsed.request?.payload?.req,
    };
  } catch {
    return null;
  }
}

export const DEFAULT_HYPERLIQUID_WS_MOCKS: WebSocketMessageMock[] = [
  {
    // webData2 is the subscription channel used by HyperLiquidSubscriptionService (non-HIP3).
    // It delivers clearinghouseState + openOrders in one channel, feeding positions/orders/account.
    // Step 1 (dynamicResponse): echo the subscription payload so isSubset() passes and
    //   `await subscription.promise` resolves immediately instead of timing out after 10s.
    // Step 2 (followUpResponse): push empty webData2 data so all three channels mark as loaded
    //   before the 3s REST fallback fires.
    messageIncludes: ['"method":"subscribe"', '"type":"webData2"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'webData2',
      data: {
        clearinghouseState: EMPTY_CLEARING_HOUSE_STATE,
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
    logMessage: 'Hyperliquid webData2 subscribe message received',
  },
  {
    // clearinghouseState subscription (HIP-3 per-DEX individual subscription).
    // When fallbackHip3Enabled=true the controller subscribes to clearinghouseState
    // instead of webData2. Send confirmation + empty follow-up so the controller
    // marks account data as loaded.
    messageIncludes: ['"method":"subscribe"', '"type":"clearinghouseState"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'clearinghouseState',
      data: {
        clearinghouseState: EMPTY_CLEARING_HOUSE_STATE,
        dex: '',
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Hyperliquid clearinghouseState subscribe message received',
  },
  {
    // openOrders subscription (HIP-3 per-DEX individual subscription).
    // Paired with clearinghouseState subscription above.
    messageIncludes: ['"method":"subscribe"', '"type":"openOrders"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'openOrders',
      data: [],
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Hyperliquid openOrders subscribe message received',
  },
  {
    // webData3 subscription (HIP-3 multi-DEX user data).
    // Used for OI caps when fallbackHip3Enabled=true.
    messageIncludes: ['"method":"subscribe"', '"type":"webData3"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'webData3',
      data: {
        perpDexStates: [
          {
            clearinghouseState: EMPTY_CLEARING_HOUSE_STATE,
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
    logMessage: 'Hyperliquid webData3 subscribe message received',
  },
  {
    // WS INFO POST for clearinghouseState — respond with empty clearing-house data
    // so the SDK promise resolves instead of timing out after 10s.
    messageIncludes: ['"method":"post"', '"type":"clearinghouseState"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, EMPTY_CLEARING_HOUSE_STATE)
        : null;
    },
    delay: 50,
    logMessage: 'Hyperliquid WS clearinghouseState POST received',
  },
  {
    // WS INFO POST for openOrders
    messageIncludes: ['"method":"post"', '"type":"openOrders"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req ? buildWsPostResponse(req.id, req.type, []) : null;
    },
    delay: 50,
    logMessage: 'Hyperliquid WS openOrders POST received',
  },
  {
    // WS INFO POST for frontendOpenOrders
    messageIncludes: ['"method":"post"', '"type":"frontendOpenOrders"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req ? buildWsPostResponse(req.id, req.type, []) : null;
    },
    delay: 50,
    logMessage: 'Hyperliquid WS frontendOpenOrders POST received',
  },
  {
    // WS INFO POST for metaAndAssetCtxs — used by buildAssetMapping for market data.
    // Returns the same structure as the HTTP mock so DEX/market setup completes quickly.
    messageIncludes: ['"method":"post"', '"type":"metaAndAssetCtxs"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      if (!req) {
        return null;
      }
      const mockUniverse = [
        { name: 'BTC', szDecimals: 5, maxLeverage: 50 },
        { name: 'ETH', szDecimals: 4, maxLeverage: 50 },
        { name: 'AVAX', szDecimals: 2, maxLeverage: 20 },
      ];
      const mockAssetCtxs = [
        {
          funding: '0.0001',
          openInterest: '1000',
          prevDayPx: '48000',
          dayNtlVlm: '50000000',
          premium: '0.0002',
          oraclePx: '50000',
          markPx: '50010',
          midPx: '50000',
          impactPxs: ['49995', '50005'],
        },
        {
          funding: '0.0001',
          openInterest: '5000',
          prevDayPx: '2900',
          dayNtlVlm: '10000000',
          premium: '0.0001',
          oraclePx: '3000',
          markPx: '3001',
          midPx: '3000',
          impactPxs: ['2995', '3005'],
        },
        {
          funding: '0.0001',
          openInterest: '200',
          prevDayPx: '24',
          dayNtlVlm: '500000',
          premium: '0.00005',
          oraclePx: '25',
          markPx: '25.01',
          midPx: '25',
          impactPxs: ['24.95', '25.05'],
        },
      ];
      return buildWsPostResponse(req.id, req.type, [
        { universe: mockUniverse },
        mockAssetCtxs,
      ]);
    },
    delay: 50,
    logMessage: 'Hyperliquid WS metaAndAssetCtxs POST received',
  },
  {
    // WS INFO POST for perpDexs — used for HIP-3 DEX discovery.
    // Return [null] where null = main DEX. The controller uses state.raw to compute
    // perpDexIndex; if null is missing, the main DEX mapping is skipped entirely.
    messageIncludes: ['"method":"post"', '"type":"perpDexs"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req ? buildWsPostResponse(req.id, req.type, [null]) : null;
    },
    delay: 50,
    logMessage: 'Hyperliquid WS perpDexs POST received',
  },
  {
    // WS INFO POST for spotClearinghouseState
    messageIncludes: ['"method":"post"', '"type":"spotClearinghouseState"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, { balances: [] })
        : null;
    },
    delay: 50,
    logMessage: 'Hyperliquid WS spotClearinghouseState POST received',
  },
  {
    // WS INFO POST for maxBuilderFee — returns 0.001 (the configured MaxFeeDecimal)
    // so the controller considers the builder fee already approved and skips the
    // approveBuilderFee /exchange call.
    messageIncludes: ['"method":"post"', '"type":"maxBuilderFee"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req ? buildWsPostResponse(req.id, req.type, 0.001) : null;
    },
    delay: 50,
    logMessage: 'Hyperliquid WS maxBuilderFee POST received',
  },
  {
    // WS INFO POST for referral — returns referredBy with the builder address
    // so the controller considers the referral already set and skips the
    // setReferralCode /exchange call.
    messageIncludes: ['"method":"post"', '"type":"referral"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, {
            referredBy: '0xea2c82b5aba243ab631c0ce151763d5e38df75b3',
          })
        : null;
    },
    delay: 50,
    logMessage: 'Hyperliquid WS referral POST received',
  },
  {
    // WS INFO POST for userDexAbstraction — returns true so the controller considers
    // DEX abstraction already enabled and skips the agentEnableDexAbstraction /exchange call.
    messageIncludes: ['"method":"post"', '"type":"userDexAbstraction"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req ? buildWsPostResponse(req.id, req.type, true) : null;
    },
    delay: 50,
    logMessage: 'Hyperliquid WS userDexAbstraction POST received',
  },
  {
    // WS INFO POST for meta — returns the universe array so buildAssetMapping
    // and fetchSingleDexFresh() can map asset names to indices.
    messageIncludes: ['"method":"post"', '"type":"meta"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      if (!req) {
        return null;
      }
      return buildWsPostResponse(req.id, req.type, {
        universe: [
          { name: 'BTC', szDecimals: 5, maxLeverage: 50 },
          { name: 'ETH', szDecimals: 4, maxLeverage: 50 },
          { name: 'AVAX', szDecimals: 2, maxLeverage: 20 },
        ],
      });
    },
    delay: 50,
    logMessage: 'Hyperliquid WS meta POST received',
  },
  {
    // WS INFO POST for allMids — returns mid prices for all assets.
    // The controller fetches this separately from metaAndAssetCtxs to get
    // current prices when building PerpsMarketData. Without this, the
    // catch-all returns {} and market.price stays at $--- (no prices).
    messageIncludes: ['"method":"post"', '"type":"allMids"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, {
            BTC: '50000',
            ETH: '3000',
            AVAX: '25',
          })
        : null;
    },
    delay: 50,
    logMessage: 'Hyperliquid WS allMids POST received',
  },
  {
    // WS INFO POST for candleSnapshot — returns a small array of candle bars
    // so the CandleStreamChannel has data and chartCurrentPrice > 0.
    // Extracts the coin from the request payload to return the right price.
    messageIncludes: ['"method":"post"', '"type":"candleSnapshot"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      if (!req) {
        return null;
      }
      const coin = (req.req?.coin as string) || 'BTC';
      const prices: Record<string, string> = {
        BTC: '50000',
        ETH: '3000',
        AVAX: '25',
      };
      const price = prices[coin] || '100';
      const now = Date.now();
      const interval = 300000;
      const candles = [];
      for (let i = 4; i >= 0; i--) {
        candles.push({
          t: now - i * interval,
          T: now - i * interval + interval - 1,
          s: coin,
          i: (req.req?.interval as string) || '5m',
          o: price,
          c: price,
          h: price,
          l: price,
          v: '1000.0',
          n: 10,
        });
      }
      return buildWsPostResponse(req.id, req.type, candles);
    },
    delay: 50,
    logMessage: 'Hyperliquid WS candleSnapshot POST received',
  },
  {
    // Generic catch-all for any remaining WS POST (userFills, historicalOrders,
    // userFunding, userNonFundingLedgerUpdates, userFees, spotMeta, etc.).
    // Responds immediately with {} so the SDK promise resolves instead of timing out (10s).
    messageIncludes: '"method":"post"',
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req ? buildWsPostResponse(req.id, req.type, {}) : null;
    },
    delay: 50,
    logMessage: 'Hyperliquid generic WS POST received',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"l2Book"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'l2Book',
      data: {
        coin: 'BTC',
        levels: [
          [
            ['50000', '1.5'],
            ['49999', '2.0'],
          ],
          [['50001', '1.2']],
        ],
        time: 0,
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Hyperliquid l2Book subscribe message received',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"trades"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: { channel: 'trades', data: [], time: 0 },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Hyperliquid trades subscribe message received',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"userFills"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: { channel: 'userFills', data: [], time: 0 },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Hyperliquid userFills subscribe message received',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"userEvents"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: { channel: 'userEvents', data: [], time: 0 },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Hyperliquid userEvents subscribe message received',
  },
  {
    messageIncludes: ['"method":"subscribe"', '"type":"allMids"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'allMids',
      data: { mids: { BTC: '50000', ETH: '3000', AVAX: '25' }, time: 0 },
      time: 0,
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Hyperliquid allMids subscribe message received',
  },
  {
    // assetCtxs subscription (HIP-3 per-DEX asset contexts)
    messageIncludes: ['"method":"subscribe"', '"type":"assetCtxs"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: { channel: 'assetCtxs', data: [], time: 0 },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Hyperliquid assetCtxs subscribe message received',
  },
  {
    // HIP-3: activeAssetCtx subscription provides live per-market funding/OI/price contexts.
    // Extracts the requested coin from the subscribe message and returns matching data.
    messageIncludes: ['"method":"subscribe"', '"type":"activeAssetCtx"'],
    dynamicResponse: buildSubscribedConfirmation,
    dynamicFollowUp: (message: string) => {
      const assetCtxBySymbol: Record<
        string,
        Record<string, string | string[]>
      > = {
        BTC: {
          funding: '0.0001',
          openInterest: '1000',
          prevDayPx: '48000',
          dayNtlVlm: '50000000',
          premium: '0.0002',
          oraclePx: '50000',
          markPx: '50010',
          midPx: '50000',
          impactPxs: ['49995', '50005'],
        },
        ETH: {
          funding: '0.0001',
          openInterest: '5000',
          prevDayPx: '2900',
          dayNtlVlm: '10000000',
          premium: '0.0001',
          oraclePx: '3000',
          markPx: '3001',
          midPx: '3000',
          impactPxs: ['2995', '3005'],
        },
        AVAX: {
          funding: '0.0001',
          openInterest: '200',
          prevDayPx: '24',
          dayNtlVlm: '500000',
          premium: '0.00005',
          oraclePx: '25',
          markPx: '25.01',
          midPx: '25',
          impactPxs: ['24.95', '25.05'],
        },
      };
      const coinMatch = message.match(/"coin"\s*:\s*"(\w+)"/u);
      const coin = coinMatch ? coinMatch[1] : 'BTC';
      const ctx = assetCtxBySymbol[coin] ?? assetCtxBySymbol.BTC;
      return {
        channel: 'activeAssetCtx',
        data: { coin, ctx },
        time: 0,
      };
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Hyperliquid activeAssetCtx subscribe message received',
  },
  {
    // Candle subscription — return a single candle so `chartCurrentPrice` is > 0
    // in the market detail page. Without this the close-position modal submit
    // stays disabled (isPriceValid = false).
    messageIncludes: ['"method":"subscribe"', '"type":"candle"'],
    dynamicResponse: buildSubscribedConfirmation,
    followUpResponse: {
      channel: 'candle',
      data: {
        t: Date.now() - 300000,
        T: Date.now() - 1,
        s: 'AVAX',
        i: '5m',
        o: '25',
        c: '25',
        h: '25',
        l: '25',
        v: '1000.0',
        n: 10,
      },
    },
    followUpDelay: 50,
    delay: 50,
    logMessage: 'Hyperliquid candle subscribe message received',
  },
  {
    // Generic fallback: echo back any remaining subscribe payload as confirmation.
    messageIncludes: 'subscribe',
    dynamicResponse: buildSubscribedConfirmation,
    delay: 50,
    logMessage: 'Hyperliquid generic subscribe message received',
  },
];
