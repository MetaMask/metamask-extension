import { type CaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { XlmScope } from '@metamask/keyring-api';
import type { Asset } from '@metamask/keyring-api';
import { AssetType } from '../../../constants/transaction';
import { isStellarClassicTrustlineInactiveForDisplay } from './trustline-from-account-asset-info';
import { getBaseReserveFromAccountAssetInfo } from './base-reserve-from-account-asset-info';

export type AccountAssetInfo = Asset['accountAssetInfo'] | undefined;

export type StellarAssetPageState = {
  isStellarChainId: boolean;
  isSep41StellarAsset: boolean;
  isStellarClassicTrustlineTrackedToken: boolean;
  isStellarTrustlineInactive: boolean;
  showStellarClassicTrustlineActivate: boolean;
  hasStellarClassicTrustlineToRemove: boolean;
  stellarNativeBaseReserve: string | undefined;
  showStellarNativeBalanceSection: boolean;
};

export function getStellarAssetPageState({
  chainId,
  assetId,
  type,
  accountAssetInfo,
}: {
  chainId: string;
  assetId?: string;
  type: AssetType;
  accountAssetInfo?: AccountAssetInfo;
}): StellarAssetPageState {
  const isStellarChainId = chainId === XlmScope.Pubnet;

  let isSep41StellarAsset = false;
  if (assetId && isStellarChainId) {
    try {
      isSep41StellarAsset =
        parseCaipAssetType(assetId as CaipAssetType).assetNamespace === 'sep41';
    } catch {
      isSep41StellarAsset = false;
    }
  }

  const isStellarClassicTrustlineTrackedToken =
    isStellarChainId &&
    type === AssetType.token &&
    Boolean(assetId) &&
    !isSep41StellarAsset;

  const isStellarTrustlineInactive =
    isStellarClassicTrustlineTrackedToken &&
    isStellarClassicTrustlineInactiveForDisplay({
      chainId,
      assetId: assetId ?? '',
      isNative: type === AssetType.native,
      accountAssetInfo,
    });

  const showStellarClassicTrustlineActivate =
    isStellarClassicTrustlineTrackedToken && isStellarTrustlineInactive;

  const hasStellarClassicTrustlineToRemove =
    accountAssetInfo !== undefined &&
    !isStellarClassicTrustlineInactiveForDisplay({
      chainId,
      assetId: assetId ?? '',
      isNative: type === AssetType.native,
      accountAssetInfo,
    });

  const stellarNativeBaseReserve =
    isStellarChainId && type === AssetType.native
      ? (getBaseReserveFromAccountAssetInfo(accountAssetInfo) ?? '0')
      : undefined;

  const showStellarNativeBalanceSection =
    isStellarChainId && type === AssetType.native;

  return {
    isStellarChainId,
    isSep41StellarAsset,
    isStellarClassicTrustlineTrackedToken,
    isStellarTrustlineInactive,
    showStellarClassicTrustlineActivate,
    hasStellarClassicTrustlineToRemove,
    stellarNativeBaseReserve,
    showStellarNativeBalanceSection,
  };
}
