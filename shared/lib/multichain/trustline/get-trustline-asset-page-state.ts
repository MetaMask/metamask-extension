import { type CaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { XlmScope } from '@metamask/keyring-api';
import { AssetType } from '../../../constants/transaction';
import {
  isTrustlineAsset,
  isAssetRequireActivate,
} from './trustline-from-account-asset-info';

export type AccountAssetInfo = { limit?: string } | undefined;


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
  //const isClassicTrustlineTrackedToken2 = isTrustlineAsset(assetId ?? '');
  const isClassicTrustlineTrackedToken = isTrustlineAsset(assetId ?? '');

  const isTrustlineInactive =
    isAssetRequireActivate({
      assetId: assetId ?? '',
      accountAssetInfo,
    });

  return {
    isClassicTrustlineTrackedToken,
    isTrustlineInactive,
  };
}
