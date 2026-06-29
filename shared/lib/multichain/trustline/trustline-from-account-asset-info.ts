import { parseCaipAssetType } from '@metamask/utils';
import { CLASSIC_TRUSTLINE_CHAIN_IDS } from '../constants';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';

type TrustlineAccountAssetInfo = {
  limit?: string;
};

function isTrustlineInactiveFromAccountAssetInfo(
  accountAssetInfo: TrustlineAccountAssetInfo | undefined,
): boolean {
  if (accountAssetInfo?.limit === undefined) {
    return true;
  }

  const { limit } = accountAssetInfo;
  if (typeof limit !== 'string') {
    return true;
  }

  const parsed = Number.parseFloat(limit);
  if (Number.isNaN(parsed)) {
    return true;
  }

  return parsed <= 0;
}

function isClassicTrustlineChainId(chainId: CaipChainId | string): boolean {
  return CLASSIC_TRUSTLINE_CHAIN_IDS.includes(chainId as CaipChainId);
}

function isClassicTrustlineAssetCaip19(assetId: CaipAssetType): boolean {
  try {
    const parsed = parseCaipAssetType(assetId);
    return (
      isClassicTrustlineChainId(parsed.chainId) &&
      parsed.assetNamespace === 'asset'
    );
  } catch {
    return false;
  }
}

export function isClassicTrustlineAsset(options: {
  chainId: CaipChainId | string;
  assetId?: CaipAssetType | string;
}): boolean {
  const { chainId, assetId } = options;
  if (!assetId) {
    return false;
  }
  return (
    isClassicTrustlineChainId(chainId) &&
    isClassicTrustlineAssetCaip19(assetId as CaipAssetType)
  );
}

/**
 * Generic helper that determines whether a classic `asset:` trustline
 * should be considered inactive for display purposes.
 * This logic was previously colocated in the Stellar-specific helper. It is
 * kept generic here and exported as `isClassicTrustlineInactiveForDisplay`.
 * @param options
 * @param options.chainId
 * @param options.assetId
 * @param options.accountAssetInfo
 * @param options.balance
 */
export function isClassicTrustlineInactiveForDisplay(options: {
  chainId: CaipChainId | string;
  assetId?: CaipAssetType | string;
  accountAssetInfo?: TrustlineAccountAssetInfo;
  balance?: string;
}): boolean {
  const { chainId, assetId, accountAssetInfo, balance } = options;

  if (!isClassicTrustlineAsset({ chainId, assetId })) {
    return false;
  }

  if (accountAssetInfo !== undefined) {
    return isTrustlineInactiveFromAccountAssetInfo(accountAssetInfo);
  }

  if (balance !== undefined) {
    const parsedBalance = Number.parseFloat(balance);
    if (!Number.isNaN(parsedBalance) && parsedBalance > 0) {
      return false;
    }
  }

  return true;
}
