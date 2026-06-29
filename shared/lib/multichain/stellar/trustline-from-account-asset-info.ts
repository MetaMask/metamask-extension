import { XlmScope } from '@metamask/keyring-api';
import { parseCaipAssetType } from '@metamask/utils';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';

type StellarTrustlineAccountAssetInfo = {
  limit?: string;
};

function isStellarTrustlineInactiveFromAccountAssetInfo(
  accountAssetInfo: StellarTrustlineAccountAssetInfo | undefined,
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

function isStellarChainId(chainId: CaipChainId | string): boolean {
  return chainId === XlmScope.Pubnet;
}

function isStellarClassicAssetCaip19(assetId: CaipAssetType): boolean {
  try {
    const parsed = parseCaipAssetType(assetId);
    return (
      isStellarChainId(parsed.chainId) && parsed.assetNamespace === 'asset'
    );
  } catch {
    return false;
  }
}

/**
 * Whether a token row should show Stellar classic trustline-inactive UX.
 * Only Stellar classic `asset:` tokens are evaluated; native, sep41, and other
 * chains always return false. Classic assets without `accountAssetInfo` are
 * treated as inactive (e.g. on first import before enrichment completes).
 * @param options
 * @param options.chainId
 * @param options.assetId
 * @param options.isNative
 * @param options.accountAssetInfo
 * @param options.balance
 */
export function isStellarClassicTrustlineInactiveForDisplay(options: {
  chainId: CaipChainId | string;
  assetId?: CaipAssetType | string;
  isNative?: boolean;
  accountAssetInfo?: StellarTrustlineAccountAssetInfo;
  balance?: string;
}): boolean {
  const { chainId, assetId, isNative, accountAssetInfo, balance } = options;

  if (isNative || !assetId || !isStellarChainId(chainId)) {
    return false;
  }

  if (!isStellarClassicAssetCaip19(assetId as CaipAssetType)) {
    return false;
  }

  if (accountAssetInfo !== undefined) {
    return isStellarTrustlineInactiveFromAccountAssetInfo(accountAssetInfo);
  }

  if (balance !== undefined) {
    const parsedBalance = Number.parseFloat(balance);
    if (!Number.isNaN(parsedBalance) && parsedBalance > 0) {
      return false;
    }
  }

  return true;
}
