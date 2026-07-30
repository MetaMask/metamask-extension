import type { AssetsControllerState } from '@metamask/assets-controller';
import {
  type,
  string,
  pattern,
  is,
  refine,
  nonempty,
  number,
  type Infer,
} from '@metamask/superstruct';
import type { CaipAssetType } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';

import { createParameterizedSelector } from '../../shared/lib/selectors/selector-creators';
import { getAssetsBalance } from './assets';

const ACCOUNT_ASSET_LRU_CACHE_SIZE = 50;

const ValidAmountStruct = refine(
  nonempty(string()),
  'valid_amount',
  (value: string) => {
    try {
      const amount = new BigNumber(value);
      if (
        // < 0
        amount.isNegative() ||
        // NaN or Infinity
        amount.isNaN() ||
        !amount.isFinite()
      ) {
        return 'Invalid amount';
      }
      return true;
    } catch {
      return 'Invalid amount';
    }
  },
);

/** Stellar pubnet native XLM CAIP-19 asset id. */
const StellarNativeAssetIdStruct = pattern(
  string(),
  /^stellar:pubnet\/slip44:148$/u,
);

/** Stellar pubnet classic asset CAIP-19 asset id. */
const StellarClassicAssetIdStruct = pattern(
  string(),
  /^stellar:pubnet\/asset:[A-Za-z0-9]{1,12}-G[A-Z2-7]{55}$/u,
);

/**
 * Trustline enrichment on AssetsController `assetsBalance` metadata for
 * classic Stellar assets.
 */
const TrustlineAssetInfoStruct = type({
  limit: ValidAmountStruct,
});

/**
 * Native enrichment on AssetsController `assetsBalance` metadata for Stellar
 * XLM. Amounts are in base units (stroops); `decimal` is used to convert them
 * to display units.
 */
const NativeAssetInfoStruct = type({
  minimumReserveBalance: ValidAmountStruct,
  spendableBalance: ValidAmountStruct,
  decimal: number(),
});

export type StellarNativeAssetId = Infer<typeof StellarNativeAssetIdStruct>;
export type StellarClassicAssetId = Infer<typeof StellarClassicAssetIdStruct>;
export type NativeAssetInfo = Infer<typeof NativeAssetInfoStruct>;
export type TrustlineAssetInfo = Infer<typeof TrustlineAssetInfoStruct>;

/**
 * Spendable balance values in display units (after base-unit conversion).
 */
export type SpendableInfo = {
  minimumReserveBalance: string;
  spendableBalance: string;
};

/**
 * Reuses `getAssetsBalance` from the assets selector. Cast is confined here so
 * call sites can pass untyped `useSelector` state without annotations.
 */
const selectAssetsBalance = getAssetsBalance as (
  state: unknown,
) => AssetsControllerState['assetsBalance'];

type AssetBalanceEntry = AssetsControllerState['assetsBalance'][string][string];

/**
 * Whether the asset supports trustline activation (Stellar classic assets).
 *
 * @param assetId - CAIP asset id to check.
 * @returns `true` when the asset supports trustline activation.
 */
export function isAssetSupportActivation(
  assetId: string | undefined,
): assetId is StellarClassicAssetId {
  return assetId !== undefined && is(assetId, StellarClassicAssetIdStruct);
}

/**
 * Whether the asset supports spendable-balance display (Stellar native XLM).
 *
 * @param assetId - CAIP asset id to check.
 * @returns `true` when the asset supports spendable-balance display.
 */
export function isAssetSupportSpendableBalance(
  assetId: string | undefined,
): assetId is StellarNativeAssetId {
  return assetId !== undefined && is(assetId, StellarNativeAssetIdStruct);
}

/**
 * Validates native-asset enrichment for a spendable-balance-capable asset.
 *
 * @param assetId - CAIP-19 asset id.
 * @param info - Balance metadata candidate.
 * @returns Validated native enrichment, or `undefined`.
 */
function getNativeAssetInfoForAsset(
  assetId: string,
  info: unknown,
): NativeAssetInfo | undefined {
  if (!isAssetSupportSpendableBalance(assetId)) {
    return undefined;
  }
  return is(info, NativeAssetInfoStruct) ? info : undefined;
}

/**
 * Validates trustline enrichment for an activation-capable asset.
 *
 * @param assetId - CAIP-19 asset id.
 * @param info - Balance metadata candidate.
 * @returns Validated trustline enrichment, or `undefined`.
 */
function getTrustlineAssetInfoForAsset(
  assetId: string,
  info: unknown,
): TrustlineAssetInfo | undefined {
  if (!isAssetSupportActivation(assetId)) {
    return undefined;
  }
  return is(info, TrustlineAssetInfoStruct) ? info : undefined;
}

/**
 * Reads optional per-balance metadata from an AssetsController balance entry.
 *
 * @param balance - Balance entry for an account/asset pair.
 * @returns Balance metadata when present.
 */
function getAssetBalanceMetadata(
  balance: AssetBalanceEntry | undefined,
): unknown {
  if (
    balance &&
    typeof balance === 'object' &&
    'metadata' in balance &&
    balance.metadata !== undefined
  ) {
    return balance.metadata;
  }
  return undefined;
}

/**
 * Converts a base-unit amount to display units.
 *
 * @param amount - Amount in base units (e.g. stroops).
 * @param decimalPlaces - Number of decimals for the asset.
 * @returns Amount in display units.
 */
function normalizeAmount(amount: string, decimalPlaces: number): string {
  return new BigNumber(amount)
    .dividedBy(new BigNumber(10).pow(decimalPlaces))
    .toFixed();
}

/**
 * Spendable balance breakdown for an account/asset pair.
 *
 * Reads `minimumReserveBalance`, `spendableBalance`, and `decimal` from
 * `assetsBalance[accountId][assetId].metadata`, then returns both amounts in
 * display units.
 *
 * Returns `undefined` when:
 * - `accountId` or `assetId` is missing
 * - the asset does not support spendable balance
 * - native enrichment is missing or fails validation
 *
 * @param state - Redux state with AssetsController balances.
 * @param accountId - Account id, when known.
 * @param assetId - CAIP asset id, when known.
 * @returns Display-unit spendable info, or `undefined`.
 */
export const getSpendableForAccount = createParameterizedSelector(
  ACCOUNT_ASSET_LRU_CACHE_SIZE,
)(
  selectAssetsBalance,
  (_state, accountId?: string) => accountId,
  (_state, _accountId?: string, assetId?: CaipAssetType) => assetId,
  (assetsBalance, accountId, assetId) => {
    if (!accountId || !assetId || !isAssetSupportSpendableBalance(assetId)) {
      return undefined;
    }
    const nativeInfo = getNativeAssetInfoForAsset(
      assetId,
      getAssetBalanceMetadata(assetsBalance[accountId]?.[assetId]),
    );
    if (!nativeInfo) {
      return undefined;
    }
    // Align with Accounts API,
    // it returns `minimumReserveBalance`, `spendableBalance` in smallest unit,
    // and provide `decimal` for conversion to display units.
    return {
      minimumReserveBalance: normalizeAmount(
        nativeInfo.minimumReserveBalance,
        nativeInfo.decimal,
      ),
      spendableBalance: normalizeAmount(
        nativeInfo.spendableBalance,
        nativeInfo.decimal,
      ),
    } satisfies SpendableInfo;
  },
);

/**
 * Trustline metadata for an account/asset pair.
 *
 * Reads `limit` from `assetsBalance[accountId][assetId].metadata`.
 *
 * Returns `undefined` when:
 * - `accountId` or `assetId` is missing
 * - the asset does not support activation
 * - trustline enrichment is missing or fails validation
 *
 * @param state - Redux state with AssetsController balances.
 * @param accountId - Account id, when known.
 * @param assetId - CAIP asset id, when known.
 * @returns Trustline info, or `undefined`.
 */
export const getTrustlineAssetInfoForAccount = createParameterizedSelector(
  ACCOUNT_ASSET_LRU_CACHE_SIZE,
)(
  selectAssetsBalance,
  (_state, accountId?: string) => accountId,
  (_state, _accountId?: string, assetId?: CaipAssetType) => assetId,
  (assetsBalance, accountId, assetId) => {
    if (!accountId || !assetId || !isAssetSupportActivation(assetId)) {
      return undefined;
    }
    return getTrustlineAssetInfoForAsset(
      assetId,
      getAssetBalanceMetadata(assetsBalance[accountId]?.[assetId]),
    );
  },
);

/**
 * Whether an asset needs trustline activation.
 *
 * Returns `false` when:
 * - `accountId` or `assetId` is missing
 * - the asset does not support activation
 * - trustline `limit` is present and non-zero (already active)
 *
 * Returns `true` when the asset is support activation and either trustline metadata is
 * missing (e.g. newly imported) or `limit` is `'0'`.
 *
 * @param state - Redux state with AssetsController balances.
 * @param accountId - Account id, when known.
 * @param assetId - CAIP asset id, when known.
 * @returns `true` when activation is still required.
 */
export const getIsAssetRequireActivate = createParameterizedSelector(
  ACCOUNT_ASSET_LRU_CACHE_SIZE,
)(
  getTrustlineAssetInfoForAccount,
  (_state, accountId?: string) => accountId,
  (_state, _accountId?: string, assetId?: CaipAssetType) => assetId,
  (assetMetadata, accountId, assetId) => {
    if (!accountId || !assetId || !isAssetSupportActivation(assetId)) {
      return false;
    }
    return !assetMetadata || assetMetadata.limit === '0';
  },
);
