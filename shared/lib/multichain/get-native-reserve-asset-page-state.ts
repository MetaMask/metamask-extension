import { XlmScope } from '@metamask/keyring-api';
import { AssetType } from '../../constants/transaction';
import { getBaseReserveFromAccountAssetInfo } from './stellar/base-reserve-from-account-asset-info';

export type AccountAssetInfo = { baseReserve?: string } | undefined;

const NATIVE_RESERVE_CHAINS = [
  XlmScope.Pubnet /* TODO: Add Ripple/XRP when supported */,
];

export function getNativeReserveAssetPageState({
  chainId,
  type,
  accountAssetInfo,
}: {
  chainId: string;
  type: AssetType;
  accountAssetInfo?: AccountAssetInfo;
}) {
  const isNativeReserveChain = NATIVE_RESERVE_CHAINS.includes(
    chainId as XlmScope,
  );

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
