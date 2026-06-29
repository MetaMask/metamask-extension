import { type CaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { XlmScope } from '@metamask/keyring-api';
import { AssetType } from '../../../constants/transaction';
import { isClassicTrustlineInactiveForDisplay } from './trustline-from-account-asset-info';

export type AccountAssetInfo = { limit?: string } | undefined;

function isSep41Asset(chainId: string, assetId?: string): boolean {
  if (!assetId) {
    return false;
  }

  // Only Stellar SEP-41 uses the "sep41" namespace in CAIP-19
  if (chainId !== XlmScope.Pubnet) {
    return false;
  }

  try {
    return (
      parseCaipAssetType(assetId as CaipAssetType).assetNamespace === 'sep41'
    );
  } catch {
    return false;
  }
}

export function getTrustlineAssetPageState({
  chainId,
  assetId,
  type,
  accountAssetInfo,
}: {
  chainId: string;
  assetId?: string;
  type: AssetType;
  accountAssetInfo?: AccountAssetInfo;
}) {
  function isSupportedClassicTrustlineAsset(assetIdParam?: string): boolean {
    if (!assetIdParam) {
      return false;
    }

    // Only the chains listed here support classic `asset:` trustlines.
    const CLASSIC_TRUSTLINE_CHAIN_IDS: string[] = [XlmScope.Pubnet];

    try {
      const parsed = parseCaipAssetType(assetIdParam as CaipAssetType);
      return (
        CLASSIC_TRUSTLINE_CHAIN_IDS.includes(parsed.chainId as string) &&
        parsed.assetNamespace === 'asset'
      );
    } catch {
      return false;
    }
  }

  const isClassicTrustlineTrackedToken =
    type === AssetType.token &&
    Boolean(assetId) &&
    isSupportedClassicTrustlineAsset(assetId) &&
    !isSep41Asset(chainId, assetId);

  const isTrustlineInactive =
    isClassicTrustlineTrackedToken &&
    isClassicTrustlineInactiveForDisplay({
      chainId,
      assetId: assetId ?? '',
      accountAssetInfo,
    });

  const showClassicTrustlineActivate =
    isClassicTrustlineTrackedToken && isTrustlineInactive;

  const hasClassicTrustlineToRemove =
    isClassicTrustlineTrackedToken &&
    accountAssetInfo !== undefined &&
    !isClassicTrustlineInactiveForDisplay({
      chainId,
      assetId: assetId ?? '',
      accountAssetInfo,
    });

  return {
    isClassicTrustlineTrackedToken,
    isTrustlineInactive,
    showClassicTrustlineActivate,
    hasClassicTrustlineToRemove,
  };
}
