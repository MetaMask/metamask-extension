import { XlmScope } from '@metamask/keyring-api';
import { parseCaipAssetType } from '@metamask/utils';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';

type StellarTrustlineExtra = {
  limit?: string;
};

function isStellarTrustlineInactiveFromExtra(
  extra: StellarTrustlineExtra | undefined,
): boolean {
  if (extra?.limit === undefined) {
    return true;
  }

  const { limit } = extra;
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
 * chains always return false. Classic assets without `extra` are treated as
 * inactive (e.g. on first import before enrichment completes).
 *
 * @param options - Token context from selectors or asset page.
 * @param options.chainId - CAIP-2 chain id for the token row.
 * @param options.assetId - CAIP-19 asset id.
 * @param options.isNative - Whether the row is a native asset.
 * @param options.extra - Balance enrichment from MultichainBalancesController.
 * @param options.balance - Display balance string.
 * @returns True when inactive trustline UX should be shown.
 */
export function isStellarClassicTrustlineInactiveForDisplay(options: {
  chainId: CaipChainId | string;
  assetId?: CaipAssetType | string;
  isNative?: boolean;
  extra?: StellarTrustlineExtra;
  balance?: string;
}): boolean {
  const { chainId, assetId, isNative, extra, balance } = options;

  if (isNative || !assetId || !isStellarChainId(chainId)) {
    return false;
  }

  if (!isStellarClassicAssetCaip19(assetId as CaipAssetType)) {
    return false;
  }

  if (extra !== undefined) {
    return isStellarTrustlineInactiveFromExtra(extra);
  }

  if (balance !== undefined) {
    const parsedBalance = Number.parseFloat(balance);
    if (!Number.isNaN(parsedBalance) && parsedBalance > 0) {
      return false;
    }
  }

  return true;
}
