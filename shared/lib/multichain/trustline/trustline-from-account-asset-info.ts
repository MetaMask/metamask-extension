import { CaipAssetTypeStruct, parseCaipAssetType } from '@metamask/utils';
import type { CaipChainId } from '@metamask/utils';
import { XlmScope } from '@metamask/keyring-api';

type TrustlineAccountAssetInfo = {
  limit?: string;
};


export const TRUSTLINE_ASSET_NAMESPACE: Record<CaipChainId, string> = {
  [XlmScope.Pubnet]: 'asset',
}

export function isTrustlineAsset(assetId: string): boolean {
   if (!assetId || !CaipAssetTypeStruct.is(assetId)) {
    return false;
  }

  const { assetNamespace, chainId } = parseCaipAssetType(assetId);

  return assetNamespace === TRUSTLINE_ASSET_NAMESPACE[chainId];
}

/**
 * Generic helper that determines whether a classic `asset:` trustline
 * should be considered inactive for display purposes.
 * This logic was previously colocated in the Stellar-specific helper. It is
 * kept generic here and exported as `isAssetRequireActivate`.
 * @param options
 * @param options.chainId
 * @param options.assetId
 * @param options.accountAssetInfo
 * @param options.balance
 */
export function isAssetRequireActivate(options: {
  assetId?: string;
  accountAssetInfo?: TrustlineAccountAssetInfo;
}): boolean {
  const { assetId, accountAssetInfo = { limit: '1' } } = options;

  if (!isTrustlineAsset(assetId ?? '')) {
    return false;
  }

  // TODO: different network can apply different logic here,
  // Today we only support Stellar, so we only check the limit.
  if (accountAssetInfo !== undefined) {
    return accountAssetInfo.limit === undefined || accountAssetInfo.limit === '0';
  }

  // default to true because of the import token doesnt have accountAssetInfo at beginning,
  // we assume it is inactive
  return true;
}
