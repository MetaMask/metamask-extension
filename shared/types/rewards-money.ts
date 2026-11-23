/** A relationship the caller holds. An empty `roles` list means none of these. */
export type ReferralRole =
  | 'REFERRER'
  | 'REFEREE'
  | 'CASHBACK_EXPERIMENT'
  | 'COPY_TRADING';

/**
 * The screen `roles` maps to. A referrer wins over a referee. An empty role
 * list is `NONE` unless the server flag forces `REFEREE`.
 */
export type ReferralVariant = 'REFERRER' | 'REFEREE' | 'NONE';

export type ReferralLocalizedText = {
  inviteTitle: string;
  inviteMessageBody: string;
  inviteReferralCode: string;
  inviteDecline: string;
  inviteAccept: string;
  inviteTermsLearnMore: string;
  inviteTermsUrl: string;
  inviteAcceptedEyebrow: string;
  inviteAcceptedTitle: string;
  inviteAcceptedBody: string;
  inviteAcceptedCloseA11y: string;
  inviteAcceptedStartTrading: string;
  inviteAcceptedViewRewards: string;
};

export type ThemeImage = {
  lightModeUrl: string;
  darkModeUrl: string;
};

/* eslint-disable @typescript-eslint/naming-convention -- money API fields */
export type ReferredByView = {
  referral_code: string | null;
};

/** Products the money service prices rates for. */
export type RateProduct = 'perps' | 'swaps' | 'predict';

/** One product's rate in `revshare_by_product` / `cashback_by_product`. */
export type ProductRate = {
  rate_bps: number;
  /** `OVERRIDE` or `DEFAULT` row of the caller's; null at 0 bps and for a program rate. */
  source: 'OVERRIDE' | 'DEFAULT' | null;
};

/**
 * Rates paying the caller right now. Each window is null when nothing pays.
 * The server fills `{cashbackPercent}` in `localized_text` before this
 * payload arrives.
 */
export type EarnRatesView = {
  /** @deprecated Summary only; use `cashback_by_product`. */
  cashback_rate_bps: number | null;
  /**
   * Window of the cashback row that pays the caller now. Null when none does.
   * The dates follow the product behind the summary rate.
   */
  cashback_earning_start: string | null;
  cashback_earning_end: string | null;
  /** @deprecated Summary only; use `revshare_by_product`. */
  revshare_rate_bps: number | null;
  /** Window of the revenue-share row that pays the caller now. */
  revshare_earning_start: string | null;
  revshare_earning_end: string | null;
  /**
   * The caller's own revenue share rate per product (0% included). Null where
   * no row covers now. Absent in a payload cached before the backend change,
   * or from an older backend.
   */
  revshare_by_product?: Record<RateProduct, ProductRate | null>;
  /**
   * The caller's own cashback rate per product (0% included). The program rate
   * (`source` null) shows only for a prospective referee: no referee row, not a
   * KOL, never in the cashback experiment. Otherwise null; `predict` is null
   * while Predict cashback is off. Absent in a payload cached before the
   * backend change, or from an older backend.
   */
  cashback_by_product?: Record<RateProduct, ProductRate | null>;
  /**
   * Program copy-trading commission per product, in bps. Null where none
   * covers now. Absent in a payload cached before the backend change, or from
   * an older backend.
   */
  copy_trading_by_product?: Record<'perps' | 'swaps', number | null>;
};

export type ReferralMeDto = {
  /** Every relationship the caller holds, in server order. Empty for none. */
  roles: ReferralRole[];
  ui_variant: ReferralVariant;
  localized_text: ReferralLocalizedText;
  invite_hero: ThemeImage | null;
  referred_by: ReferredByView | null;
  earn_rates: EarnRatesView;
  excluded_regions: string[];
};
/* eslint-enable @typescript-eslint/naming-convention */

export type RegisterRefereeDto = {
  code: string;
};

export type GetReferralMeDto = {
  forceFresh?: boolean;
};

/** Products this client asks `POST /earnings/rebate/quote` about. */
export type RebateQuoteProduct = 'swaps' | 'perps';

/**
 * Why a 200 quote shows no rebate row. Mirrors the money service. A shed is
 * not one of these: that is HTTP 503 with body reason `SERVER_BUSY`.
 */
export type RebateQuoteReason =
  | 'NO_REBATE'
  | 'FEE_TOKEN_NOT_ELIGIBLE'
  | 'REGION_RESTRICTED'
  | 'PRODUCT_NOT_SUPPORTED';

/**
 * `POST /earnings/rebate/quote`. `rebateBips` is bips of the MetaMask fee:
 * 2000 is 20%.
 */
export type RebateQuoteResponse = {
  product: RebateQuoteProduct;
  /** Always `rebateBips > 0`. */
  eligible: boolean;
  rebateBips: number;
  reason: RebateQuoteReason | null;
};

export type PerpsRebateTradeSide = 'BUY' | 'SELL';

/**
 * What the perps client is about to trade. The server validates this and
 * drops it: no rate depends on it today. The controller leaves out a trade
 * the server would refuse, so a bad one never costs the quote.
 */
export type PerpsRebateTrade = {
  /**
   * A Hyperliquid perp name: `BTC`, or a builder-deployed `xyz:TSLA`. Spot
   * names such as `@107` are not perps.
   */
  coin: string;
  side: PerpsRebateTradeSide;
  /**
   * Size times price in USD, as a plain non-negative decimal string: up to
   * 15 integer digits and 18 decimals, no sign, no exponent.
   */
  notionalUsd: string;
};

/**
 * The swaps bridge quote a rebate quote is asked about. Only `feeData`
 * matters; the server reads `feeData.metabridge` alone.
 */
export type SwapsRebateBridgeQuote = {
  feeData: {
    metabridge: unknown;
  };
};

/**
 * Body of `POST /earnings/rebate/quote`. The controller sets `product`;
 * callers never do. Swaps send only the MetaMask fee leg of the quote.
 */
export type RebateQuoteBody =
  | {
      product: 'swaps';
      quote: {
        feeData: {
          metabridge: SwapsRebateBridgeQuote['feeData']['metabridge'];
        };
      };
    }
  | {
      product: 'perps';
      trade?: PerpsRebateTrade;
    };
