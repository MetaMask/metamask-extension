import { ERC1155 } from '@metamask/controller-utils';
import { useMemo } from 'react';

import { Numeric } from '../../../../../shared/lib/Numeric';
import { Asset } from '../../types/send';
import { formatToFixedDecimals, toTokenMinimalUnit } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useNonEvmBalance } from '../useNonEvmBalance';

const getBalance = (asset?: Asset) => {
  if (!asset) {
    return {
      balance: '0',
      decimals: 0,
      fullBalance: '0',
      rawBalanceNumeric: new Numeric('0', 10),
    };
  }

  const rawBalanceHex = asset?.rawBalance ?? '0x0';
  const fullBalance = toTokenMinimalUnit(rawBalanceHex, asset.decimals);

  return {
    balance: formatToFixedDecimals(fullBalance, asset.decimals),
    decimals: asset.decimals,
    fullBalance,
    rawBalanceNumeric: new Numeric(rawBalanceHex, 16).toBase(10),
  };
};

export const useBalance = () => {
  const { asset, chainId, fromAccount } = useSendContext();
  const nonEvmBalance = useNonEvmBalance({
    accountAddress: fromAccount?.address ?? asset?.accountAddress,
    assetId: asset?.assetId,
    chainId: chainId ?? asset?.chainId?.toString(),
    decimals: asset?.decimals,
  });

  const { balance, decimals, fullBalance, rawBalanceNumeric } = useMemo(() => {
    if (asset?.standard === ERC1155) {
      const bal = asset?.balance ?? '0';
      return {
        balance: bal,
        decimals: 0,
        fullBalance: bal,
        rawBalanceNumeric: new Numeric(bal, 10),
      };
    }

    if (
      nonEvmBalance.isSupported &&
      nonEvmBalance.isLoaded &&
      nonEvmBalance.balanceRaw !== undefined &&
      nonEvmBalance.balanceDisplay !== undefined
    ) {
      return {
        balance: formatToFixedDecimals(
          nonEvmBalance.balanceDisplay,
          asset?.decimals,
        ),
        decimals: asset?.decimals ?? 0,
        fullBalance: nonEvmBalance.balanceDisplay,
        rawBalanceNumeric: new Numeric(nonEvmBalance.balanceRaw, 10),
      };
    }

    return getBalance(asset);
  }, [asset, nonEvmBalance]);

  return {
    balance,
    decimals,
    fullBalance,
    rawBalanceNumeric,
  };
};
