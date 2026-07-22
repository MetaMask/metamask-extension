import type { CaipAssetType } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';

/* eslint-disable import-x/no-restricted-paths -- controller exports enrichment helpers used by UI selectors */
import {
  getNativeAssetInfoForAsset,
  getTrustlineAssetInfoForAsset,
} from '../../app/scripts/controllers/stellar-assets-controller';
/* eslint-enable import-x/no-restricted-paths */
import { isSupportBaseReserve } from '../../shared/lib/multichain/spendable-balance';
import { getAdditionalReserveForMissingTrustline } from '../../shared/lib/multichain/trustline';
import { createParameterizedSelector } from '../../shared/lib/selectors/selector-creators';

const ACCOUNT_ASSET_LRU_CACHE_SIZE = 50;

export type StellarAssetsSelectorState = {
  metamask?: {
    accountAssets?: Record<string, Record<string, unknown>>;
  };
};

function getStellarAccountAssets(
  state: StellarAssetsSelectorState,
): Record<string, Record<string, unknown>> {
  return state.metamask?.accountAssets ?? {};
}

function isValidNumberString(value?: string): boolean {
  if (value === undefined) {
    return false;
  }
  try {
    const parsed = new BigNumber(value);
    return parsed.isFinite() && !parsed.isNegative();
  } catch {
    return false;
  }
}

function resolveBaseReserve(
  assetId: string,
  nativeAssetInfo: ReturnType<typeof getNativeAssetInfoForAsset>,
): string | undefined {
  if (!isSupportBaseReserve(assetId)) {
    return undefined;
  }

  return isValidNumberString(nativeAssetInfo?.baseReserve)
    ? nativeAssetInfo?.baseReserve
    : '0';
}

/**
 * Returns the base reserve for a Stellar native asset that supports reserve balance display.
 */
export const getStellarBaseReserveForAccountAsset = createParameterizedSelector(
  ACCOUNT_ASSET_LRU_CACHE_SIZE,
)(
  getStellarAccountAssets,
  (_state: StellarAssetsSelectorState, accountId: string) => accountId,
  (
    _state: StellarAssetsSelectorState,
    _accountId: string,
    assetId: CaipAssetType,
  ) => assetId,
  (accountAssets, accountId, assetId) =>
    resolveBaseReserve(
      assetId,
      getNativeAssetInfoForAsset(assetId, accountAssets[accountId]?.[assetId]),
    ),
);

/**
 * Returns Stellar trustline metadata for an account/asset pair.
 */
export const getStellarTrustlineAssetInfoForAccount =
  createParameterizedSelector(ACCOUNT_ASSET_LRU_CACHE_SIZE)(
    getStellarAccountAssets,
    (_state: StellarAssetsSelectorState, accountId: string) => accountId,
    (
      _state: StellarAssetsSelectorState,
      _accountId: string,
      assetId: CaipAssetType,
    ) => assetId,
    (accountAssets, accountId, assetId) =>
      getTrustlineAssetInfoForAsset(
        assetId,
        accountAssets[accountId]?.[assetId],
      ),
  );

/**
 * Returns the dynamic native reserve required for a Stellar swap.
 *
 * The cached native reserve already includes existing account subentries. One
 * additional base reserve is included when the destination classic asset does
 * not yet have a trustline. Missing or zero native enrichment is treated as
 * unavailable so it cannot produce a guessed trustline-only reserve.
 */
export const getStellarMinimumReserveForSwap = createParameterizedSelector(
  ACCOUNT_ASSET_LRU_CACHE_SIZE,
)(
  getStellarAccountAssets,
  (_state: StellarAssetsSelectorState, accountId: string) => accountId,
  (
    _state: StellarAssetsSelectorState,
    _accountId: string,
    nativeAssetId: CaipAssetType,
  ) => nativeAssetId,
  (
    _state: StellarAssetsSelectorState,
    _accountId: string,
    _nativeAssetId: CaipAssetType,
    toAssetId?: CaipAssetType,
  ) => toAssetId,
  (accountAssets, accountId, nativeAssetId, toAssetId) => {
    const baseReserve = resolveBaseReserve(
      nativeAssetId,
      getNativeAssetInfoForAsset(
        nativeAssetId,
        accountAssets[accountId]?.[nativeAssetId],
      ),
    );
    const parsedBaseReserve = new BigNumber(baseReserve ?? 0);

    if (!parsedBaseReserve.gt(0)) {
      return '0';
    }

    const trustlineInfo = toAssetId
      ? getTrustlineAssetInfoForAsset(
          toAssetId,
          accountAssets[accountId]?.[toAssetId],
        )
      : undefined;

    return parsedBaseReserve
      .plus(
        getAdditionalReserveForMissingTrustline({
          toAssetId,
          toAssetMetadata: trustlineInfo,
        }),
      )
      .toString();
  },
);
