import { AssetType } from '../../constants/transaction';
import { NATIVE_RESERVE_CHAIN_IDS } from './constants';

export type AccountAssetInfo = { baseReserve?: string } | undefined;

function parseFloatSafe(
  value ?: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return value;
}

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
      ? (parseFloatSafe(accountAssetInfo?.baseReserve) ?? '0')
      : undefined;

  const showNativeReserveBalanceSection =
    isNativeReserveChain && type === AssetType.native;

  return {
    nativeReserveBaseReserve,
    showNativeReserveBalanceSection,
  };
}
