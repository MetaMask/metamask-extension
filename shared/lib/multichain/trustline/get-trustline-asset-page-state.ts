import { type CaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { XlmScope } from '@metamask/keyring-api';
import {
  isClassicTrustlineAsset,
  isClassicTrustlineInactiveForDisplay,
} from './trustline-from-account-asset-info';
import { AssetType } from '../../../constants/transaction';

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
  const isClassicTrustlineTrackedToken =
    type === AssetType.token &&
    Boolean(assetId) &&
    isClassicTrustlineAsset({ chainId, assetId }) &&
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
