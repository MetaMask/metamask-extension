import type { CaipAssetType } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';

/* eslint-disable import-x/no-restricted-paths -- controller exports enrichment helpers used by UI selectors */
import {
  getNativeAssetInfoForAsset,
  getTrustlineAssetInfoForAsset,
  type StellarAssetsControllerState,
} from '../../app/scripts/controllers/stellar-assets-controller';
/* eslint-enable import-x/no-restricted-paths */
import { isSupportBaseReserve } from '../../shared/lib/multichain/spendable-balance';
import { createParameterizedSelector } from '../../shared/lib/selectors/selector-creators';

const ACCOUNT_ASSET_LRU_CACHE_SIZE = 50;

type StellarAssetsSelectorState = {
  metamask?: Pick<StellarAssetsControllerState, 'accountAssets'>;
};

function getStellarAccountAssets(
  state: StellarAssetsSelectorState,
): StellarAssetsControllerState['accountAssets'] {
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
    (_state, accountId: string) => accountId,
    (_state, _accountId: string, assetId: CaipAssetType) => assetId,
    (accountAssets, accountId, assetId) =>
      getTrustlineAssetInfoForAsset(
        assetId,
        accountAssets[accountId]?.[assetId],
      ),
  );
