/**
 * WebSocket mock helpers for Perps deep-link tests that require HIP-3 equity markets.
 *
 * These mocks set up the `xyz` HIP-3 DEX with a single TSLA equity market so
 * the Stocks filter on the market-list page shows a non-empty list.
 *
 * Usage — pass as `perpsWebSocketSpecificMocks` in withFixtures alongside
 * `enableHip3: true` in `getPerpsDeepLinkConfig`:
 * ```ts
 * await withFixtures({
 *   ...await getPerpsDeepLinkConfig({ deepLinkPublicKey, enableHip3: true }),
 *   perpsWebSocketSpecificMocks: WS_WITH_STOCKS_MARKET,
 * }, ...)
 * ```
 *
 * HTTP mocks for `metaAndAssetCtxs` and `allMids` for the xyz DEX are handled
 * inside `getPerpsDeepLinkConfig` when `enableHip3: true` is passed.
 */

import type { WebSocketMessageMock } from '../../../websocket/types';
import { buildWsPostResponse, parseWsPost } from './websocketDefaultMocks';

const TSLA_UNIVERSE = [
  { name: 'TSLA', szDecimals: 2, maxLeverage: 10 },
];

const TSLA_ASSET_CTX = {
  funding: '0.0001',
  openInterest: '100',
  prevDayPx: '175.00',
  dayNtlVlm: '1000000',
  premium: '0.0001',
  oraclePx: '180.00',
  markPx: '180.10',
  midPx: '180.00',
  impactPxs: ['179.90', '180.10'],
};

/**
 * WebSocket mocks that introduce the `xyz` HIP-3 DEX with one equity market (TSLA).
 *
 * - `perpDexs` → `[null, {name:'xyz'}]` (discovers the xyz DEX alongside the main DEX)
 * - `meta` for xyz → `{universe:[{name:'TSLA',...}]}` (confirms xyz has markets)
 * - `metaAndAssetCtxs` for xyz → full market + asset ctx (populates build asset mapping)
 */
export const WS_WITH_STOCKS_MARKET: WebSocketMessageMock[] = [
  {
    // Override perpDexs to expose the xyz HIP-3 DEX
    messageIncludes: ['"method":"post"', '"type":"perpDexs"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, [null, { name: 'xyz' }])
        : null;
    },
    delay: 50,
    logMessage: 'Stocks mock: perpDexs with xyz HIP-3 DEX',
  },
  {
    // meta for xyz DEX — used by getAvailableHip3Dexs to confirm markets exist.
    // More specific than the default meta mock (adds '"dex":"xyz"' to includes).
    messageIncludes: ['"method":"post"', '"type":"meta"', '"dex":"xyz"'],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, { universe: TSLA_UNIVERSE })
        : null;
    },
    delay: 50,
    logMessage: 'Stocks mock: meta for xyz DEX with TSLA',
  },
  {
    // metaAndAssetCtxs for xyz DEX — used by buildAssetMapping WS path.
    // More specific than the default metaAndAssetCtxs mock (adds '"dex":"xyz"').
    messageIncludes: [
      '"method":"post"',
      '"type":"metaAndAssetCtxs"',
      '"dex":"xyz"',
    ],
    dynamicResponse: (message: string) => {
      const req = parseWsPost(message);
      return req
        ? buildWsPostResponse(req.id, req.type, [
            { universe: TSLA_UNIVERSE },
            [TSLA_ASSET_CTX],
          ])
        : null;
    },
    delay: 50,
    logMessage: 'Stocks mock: metaAndAssetCtxs for xyz DEX',
  },
];
