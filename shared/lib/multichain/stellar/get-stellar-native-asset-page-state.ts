import { XlmScope } from '@metamask/keyring-api';
import { AssetType } from '../../../constants/transaction';
import { getBaseReserveFromAccountAssetInfo } from './base-reserve-from-account-asset-info';

export type AccountAssetInfo = { baseReserve?: string } | undefined;

export function getStellarNativeAssetPageState({
  chainId,
  type,
  accountAssetInfo,
}: {
  chainId: string;
  type: AssetType;
  accountAssetInfo?: AccountAssetInfo;
}) {
  const isStellarChainId = chainId === XlmScope.Pubnet;

  const stellarNativeBaseReserve =
    isStellarChainId && type === AssetType.native
      ? (getBaseReserveFromAccountAssetInfo(accountAssetInfo) ?? '0')
      : undefined;

  const showStellarNativeBalanceSection =
    isStellarChainId && type === AssetType.native;

  return {
    stellarNativeBaseReserve,
    showStellarNativeBalanceSection,
  };
}
