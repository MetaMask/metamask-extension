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
import {
  parseCaipAssetType,
  isCaipAssetType,
  type CaipAssetType,
} from '@metamask/utils';
import { BigNumber } from 'bignumber.js';

import { createParameterizedSelector } from '../../shared/lib/selectors/selector-creators';
import { getAssetsBalance } from './assets';
import { getInternalAccountBySelectedAccountGroupAndCaip } from './multichain-accounts/account-tree';

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
): assetId is StellarClassicAssetId & CaipAssetType {
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
): assetId is StellarNativeAssetId & CaipAssetType {
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
 * Parameters for account/asset Stellar selectors.
 */
export type StellarAccountAssetParams = {
  accountId?: string;
  assetId: string;
};

/**
 * Resolves an account id from an explicit override, or from the selected
 * account for the asset's CAIP chain.
 *
 * @param state - Redux state.
 * @param params - Account/asset lookup params.
 * @returns Resolved account id, or `undefined`.
 */
function selectResolvedAccountIdForAsset(
  state: unknown,
  params: StellarAccountAssetParams,
): string | undefined {
  const { accountId, assetId } = params;
  if (accountId) {
    return accountId;
  }
  if (!isCaipAssetType(assetId)) {
    return undefined;
  }
  return getInternalAccountBySelectedAccountGroupAndCaip(
    state,
    parseCaipAssetType(assetId).chainId,
  )?.id;
}

/**
 * Spendable balance breakdown for an account/asset pair.
 *
 * Reads `minimumReserveBalance`, `spendableBalance`, and `decimal` from
 * `assetsBalance[accountId][assetId].metadata`, then returns both amounts in
 * display units.
 * When `accountId` is omitted, falls back to the selected internal account for
 * the asset's CAIP chain.
 *
 * Returns `undefined` when:
 * - `assetId` is not a CAIP asset type that supports spendable balance
 * - a resolved `accountId` is missing
 * - native enrichment is missing or fails validation
 *
 * @param state - Redux state with AssetsController balances.
 * @param params - Account/asset lookup params.
 * @param params.accountId - Optional account id override.
 * @param params.assetId - Asset id (CAIP when valid).
 * @returns Display-unit spendable info, or `undefined`.
 */
export const getSpendableForAccount = createParameterizedSelector(
  ACCOUNT_ASSET_LRU_CACHE_SIZE,
)(
  selectAssetsBalance,
  selectResolvedAccountIdForAsset,
  (_state: unknown, params: StellarAccountAssetParams) => params.assetId,
  (assetsBalance, resolvedAccountId, assetId) => {
    if (!isAssetSupportSpendableBalance(assetId) || !resolvedAccountId) {
      return undefined;
    }
    const nativeInfo = getNativeAssetInfoForAsset(
      assetId,
      getAssetBalanceMetadata(assetsBalance[resolvedAccountId]?.[assetId]),
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
 * When `accountId` is omitted, falls back to the selected internal account for
 * the asset's CAIP chain.
 *
 * Returns `undefined` when:
 * - `assetId` is missing or not a CAIP asset type that supports activation
 * - a resolved `accountId` is missing
 * - trustline enrichment is missing or fails validation
 *
 * @param state - Redux state with AssetsController balances.
 * @param params - Account/asset lookup params.
 * @param params.accountId - Optional account id override.
 * @param params.assetId - Asset id (CAIP when known).
 * @returns Trustline info, or `undefined`.
 */
export const getTrustlineAssetInfoForAccount = createParameterizedSelector(
  ACCOUNT_ASSET_LRU_CACHE_SIZE,
)(
  selectAssetsBalance,
  selectResolvedAccountIdForAsset,
  (_state: unknown, params: StellarAccountAssetParams) => params.assetId,
  (assetsBalance, resolvedAccountId, assetId) => {
    if (!isAssetSupportActivation(assetId) || !resolvedAccountId) {
      return undefined;
    }
    return getTrustlineAssetInfoForAsset(
      assetId,
      getAssetBalanceMetadata(assetsBalance[resolvedAccountId]?.[assetId]),
    );
  },
);

/**
 * Whether an asset needs trustline activation.
 * When `accountId` is omitted, falls back to the selected internal account for
 * the asset's CAIP chain.
 *
 * Returns `false` when:
 * - `assetId` is missing or not a CAIP asset type that supports activation
 * - a resolved `accountId` is missing
 * - trustline `limit` is present and non-zero (already active)
 *
 * Returns `true` when the asset is support activation and either trustline metadata is
 * missing (e.g. newly imported) or `limit` is `'0'`.
 *
 * @param state - Redux state with AssetsController balances.
 * @param params - Account/asset lookup params.
 * @param params.accountId - Optional account id override.
 * @param params.assetId - Asset id (CAIP when known).
 * @returns `true` when activation is still required.
 */
export const getIsAssetRequireActivate = createParameterizedSelector(
  ACCOUNT_ASSET_LRU_CACHE_SIZE,
)(
  getTrustlineAssetInfoForAccount,
  selectResolvedAccountIdForAsset,
  (_state: unknown, params: StellarAccountAssetParams) => params.assetId,
  (assetMetadata, resolvedAccountId, assetId) => {
    if (!isAssetSupportActivation(assetId) || !resolvedAccountId) {
      return false;
    }
    if (assetMetadata) {
      return assetMetadata.limit === '0';
    }
    // Missing metadata is ambiguous (no account vs newly imported).
    // No account → don’t require activation.
    // No metadata → require activation (newly imported).
    return true;
  },
);
