import { Hex } from '@metamask/utils';
import { ERC1155 } from '@metamask/controller-utils';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isNativeAddress } from '@metamask/bridge-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getTokenBalances } from '../../../../ducks/metamask/metamask';
import { Asset } from '../../types/send';
import { formatToFixedDecimals, toTokenMinimalUnit } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';

type AccountWithBalances = Record<Hex, { balance: Hex }>;
type TokenBalances = Record<Hex, Record<Hex, Record<Hex, Hex>>>;
type MetamaskSendState = {
  metamask: { accountsByChainId: Record<Hex, AccountWithBalances> };
};
type GetEvmBalanceArgs = {
  accountsWithBalances?: AccountWithBalances;
  asset?: Asset;
  from: string;
  tokenBalances: TokenBalances;
};

const getEvmBalance = ({
  accountsWithBalances,
  asset,
  from,
  tokenBalances,
}: GetEvmBalanceArgs) => {
  if (!asset) {
    return '0';
  }
  if (isNativeAddress(asset.address)) {
    if (!accountsWithBalances) {
      return '0';
    }
    const accountAddress = Object.keys(accountsWithBalances).find(
      (address) => address.toLowerCase() === from.toLowerCase(),
    ) as Hex;
    const account = accountsWithBalances[accountAddress];
    return formatToFixedDecimals(
      toTokenMinimalUnit(account.balance, asset.decimals),
      asset.decimals,
    );
  }
  const tokenBalance = (
    Object.values(tokenBalances[from as Hex]).find(
      (chainTokenBalances: Record<Hex, Hex>) =>
        chainTokenBalances?.[asset?.address as Hex],
    ) as Record<Hex, Hex>
  )?.[asset?.address as Hex];

  return formatToFixedDecimals(
    toTokenMinimalUnit(tokenBalance, asset.decimals),
    asset.decimals,
  );
};

const getNonEvmBalance = (asset?: Asset) => {
  if (!asset) {
    return '0';
  }

  return formatToFixedDecimals(asset.primary, asset.decimals);
};

export const useBalance = () => {
  const { asset, chainId, from } = useSendContext();
  const tokenBalances = useSelector(getTokenBalances);
  const { isEvmSendType } = useSendType();
  const accountsByChainId = useSelector(
    (state: MetamaskSendState) => state.metamask.accountsByChainId,
  ) as AccountWithBalances;
  const accountsWithBalances = useMemo(() => {
    if (chainId && asset?.address && isEvmAddress(asset?.address)) {
      return accountsByChainId[chainId as Hex];
    }
    return undefined;
  }, [accountsByChainId, asset?.address, chainId]);

  const balance = useMemo(() => {
    if (asset?.standard === ERC1155) {
      return asset?.balance ?? '0';
    }
    if (isEvmSendType) {
      return getEvmBalance({
        accountsWithBalances,
        asset,
        from,
        tokenBalances,
      });
    }
    return getNonEvmBalance(asset);
  }, [accountsWithBalances, asset, from, isEvmSendType, tokenBalances]);

  return {
    balance,
  };
};
