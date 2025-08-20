import { ERC1155 } from '@metamask/controller-utils';
import { Hex } from '@metamask/utils';
import { isNativeAddress } from '@metamask/bridge-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getMetaMaskAccountBalances } from '../../../../selectors';
import { getTokenBalances } from '../../../../ducks/metamask/metamask';
import { Asset } from '../../types/send';
import { formatToFixedDecimals, toTokenMinimalUnit } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';

type AccountWithBalances = Record<Hex, { address: Hex; balance: Hex }>;
type TokenBalances = Record<Hex, Record<Hex, Record<Hex, Hex>>>;

export interface GetEvmBalanceArgs {
  accountsWithBalances: AccountWithBalances;
  asset?: Asset;
  from: string;
  tokenBalances: TokenBalances;
}

export const getEvmBalance = ({
  accountsWithBalances,
  asset,
  from,
  tokenBalances,
}: GetEvmBalanceArgs) => {
  if (!asset) {
    return '0';
  }
  if (isNativeAddress(asset.address)) {
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
        chainTokenBalances[asset?.address as Hex],
    ) as Record<Hex, Hex>
  )[asset?.address as Hex];

  return formatToFixedDecimals(
    toTokenMinimalUnit(tokenBalance, asset.decimals),
    asset.decimals,
  );
};

export const getNonEvmBalance = (asset?: Asset) => {
  if (!asset) {
    return '0';
  }

  return formatToFixedDecimals(asset.primary, asset.decimals);
};

export const useBalance = () => {
  const accountsWithBalances = useSelector(
    getMetaMaskAccountBalances,
  ) as AccountWithBalances;
  const tokenBalances = useSelector(getTokenBalances);
  const { asset, from } = useSendContext();
  const { isEvmSendType } = useSendType();

  const balance = useMemo(() => {
    if (asset?.standard === ERC1155) {
      // todo: add logic to check balance units for ERC1155 tokens
      return '0';
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
