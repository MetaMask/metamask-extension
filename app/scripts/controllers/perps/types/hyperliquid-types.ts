/**
 * HyperLiquid SDK Type Aliases
 *
 * The @nktkas/hyperliquid SDK only exports Response types (e.g., ClearinghouseStateResponse).
 * We extract commonly-used nested types here to avoid repetitive type extraction syntax.
 *
 * NOTE: For the extension mock, we stub these types since the SDK is not installed.
 * When integrating the real @metamask/perps-controller, these will be imported from the SDK.
 */

// Stubbed types for extension mock - these match the SDK structure
// In the real implementation, these would be imported from @nktkas/hyperliquid

/**
 * Clearinghouse state response from HyperLiquid API
 */
export type ClearinghouseStateResponse = {
  assetPositions: Array<{
    position: {
      coin: string;
      szi: string;
      leverage: { type: string; value: number; rawUsd?: string };
      entryPx: string;
      positionValue: string;
      unrealizedPnl: string;
      marginUsed: string;
      liquidationPx: string | null;
      maxLeverage: number;
      returnOnEquity: string;
      cumFunding: { allTime: string; sinceOpen: string; sinceChange: string };
    };
  }>;
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  withdrawable: string;
};

/**
 * Spot clearinghouse state response
 */
export type SpotClearinghouseStateResponse = {
  balances: Array<{
    coin: string;
    hold: string;
    token: number;
    total: string;
  }>;
};

/**
 * Meta response with universe info
 */
export type MetaResponse = {
  universe: Array<{
    name: string;
    szDecimals: number;
    maxLeverage: number;
    onlyIsolated?: boolean;
    isDelisted?: boolean;
  }>;
};

/**
 * Frontend open orders response
 */
export type FrontendOpenOrdersResponse = Array<{
  coin: string;
  oid: number;
  limitPx: string;
  sz: string;
  side: string;
  timestamp: number;
  orderType: string;
  origSz: string;
  reduceOnly?: boolean;
  triggerPx?: string;
  triggerCondition?: string;
  tpsl?: string;
  children?: Array<{ oid: number; sz: string; limitPx: string }>;
}>;

/**
 * Meta and asset contexts response
 */
export type MetaAndAssetCtxsResponse = [
  MetaResponse,
  Array<{
    funding: string;
    openInterest: string;
    prevDayPx: string;
    dayNtlVlm: string;
    premium?: string;
    oraclePx?: string;
    markPx?: string;
    midPx?: string;
    impactPxs?: string[];
  }>,
];

/**
 * All mids response - maps coin to mid price
 */
export type AllMidsResponse = Record<string, string>;

/**
 * Predicted fundings response
 */
export type PredictedFundingsResponse = Array<{
  coin: string;
  exchange: string;
  funding: number;
}>;

// Clearinghouse (Account) Types
export type AssetPosition =
  ClearinghouseStateResponse['assetPositions'][number];
export type SpotBalance = SpotClearinghouseStateResponse['balances'][number];

// Market/Asset Types
export type PerpsUniverse = MetaResponse['universe'][number];
export type PerpsAssetCtx = MetaAndAssetCtxsResponse[1][number];
export type PredictedFunding = PredictedFundingsResponse[number];

// Order Types
export type FrontendOrder = FrontendOpenOrdersResponse[number];
export type OrderType = FrontendOrder['orderType'];

/**
 * Extended asset metadata including Growth Mode fields not in SDK types.
 *
 * The HyperLiquid API returns these fields but the SDK doesn't type them.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees#fee-formula-for-developers
 */
export type ExtendedAssetMeta = {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  /** Per-asset Growth Mode status - "enabled" means 90% fee reduction */
  growthMode?: 'enabled' | null;
  /** ISO timestamp of last Growth Mode change */
  lastGrowthModeChangeTime?: string;
};

/**
 * Extended perp DEX info including fee scale fields not in SDK types.
 *
 * The HyperLiquid API returns these fields but the SDK doesn't type them.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees#fee-formula-for-developers
 */
export type ExtendedPerpDex = {
  name: string;
  fullName?: string;
  deployer?: string;
  /** DEX-level fee scale (e.g., "1.0" for xyz DEX) - determines HIP-3 multiplier */
  deployerFeeScale?: string;
  /** ISO timestamp of last fee scale change */
  lastDeployerFeeScaleChangeTime?: string;
};
