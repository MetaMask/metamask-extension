import { AssetType } from '../../constants/transaction';
import { getBaseReserveFromAccountAssetInfo } from './base-reserve-from-account-asset-info';
import { NATIVE_RESERVE_CHAIN_IDS } from './constants';

export type AccountAssetInfo = { baseReserve?: string } | undefined;

export function getNativeReserveAssetPageState({
  chainId,
  type,
  accountAssetInfo,
}: {
  chainId: string;
  type: AssetType;
  accountAssetInfo?: AccountAssetInfo;
}) {
  const isNativeReserveChain = NATIVE_RESERVE_CHAIN_IDS.includes(chainId);

  const nativeReserveBaseReserve =
    isNativeReserveChain && type === AssetType.native
      ? (getBaseReserveFromAccountAssetInfo(accountAssetInfo) ?? '0')
      : undefined;

  const showNativeReserveBalanceSection =
    isNativeReserveChain && type === AssetType.native;

  return {
    nativeReserveBaseReserve,
    showNativeReserveBalanceSection,
  };
}
