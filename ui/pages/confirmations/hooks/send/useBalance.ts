import { ERC1155 } from '@metamask/controller-utils';
import { Hex } from '@metamask/utils';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isNativeAddress } from '@metamask/bridge-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Numeric } from '../../../../../shared/modules/Numeric';
import { getMultichainBalances } from '../../../../selectors/multichain';
import { getTokenBalances } from '../../../../ducks/metamask/metamask';
import { Asset } from '../../types/send';
import {
  formatToFixedDecimals,
  fromTokenMinUnitsNumeric,
  toTokenMinimalUnit,
} from '../../utils/send';
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
  isEvmSendType?: boolean;
  multichainBalances: Record<Hex, Record<string, { amount: string }>>;
  tokenBalances: TokenBalances;
};

const getBalance = ({
  accountsWithBalances,
  asset,
  from,
  isEvmSendType,
  multichainBalances,
  tokenBalances,
}: GetEvmBalanceArgs) => {
  if (!asset) {
    return {
      balance: '0',
      decimals: 0,
      rawBalanceNumeric: new Numeric('0', 10),
    };
  }

  let rawBalanceHex = asset?.rawBalance;

  if (!rawBalanceHex && isEvmSendType) {
    if (isNativeAddress(asset.address)) {
      // todo: check this value is not same on different networks
      const accountAddress = Object.keys(accountsWithBalances ?? {}).find(
        (address) => address.toLowerCase() === from.toLowerCase(),
      ) as Hex;
      const account = accountsWithBalances?.[accountAddress];
      rawBalanceHex = account?.balance;
    } else {
      rawBalanceHex = (
        Object.values(tokenBalances[from as Hex]).find(
          (chainTokenBalances: Record<Hex, Hex>) =>
            chainTokenBalances?.[asset?.address as Hex],
        ) as Record<Hex, Hex>
      )?.[asset?.address as Hex];
    }
  }

  if (rawBalanceHex) {
    return {
      balance: formatToFixedDecimals(
        toTokenMinimalUnit(rawBalanceHex, asset.decimals),
        asset.decimals,
      ),
      decimals: asset.decimals,
      rawBalanceNumeric: new Numeric(rawBalanceHex, 16).toBase(10),
    };
  }

  // todo: check this field is not asset.balance
  if (asset.primary) {
    return {
      balance: formatToFixedDecimals(asset.primary, asset.decimals),
      decimals: asset.decimals,
      rawBalanceNumeric: fromTokenMinUnitsNumeric(
        asset.primary,
        10,
        asset.decimals,
      ),
    };
  }

  const assetId = asset.assetId ?? asset.address;
  if (assetId && multichainBalances) {
    const assetBalance =
      Object.values(multichainBalances)?.[0]?.[assetId]?.amount;
    if (assetBalance) {
      return {
        balance: formatToFixedDecimals(assetBalance, asset.decimals),
        decimals: asset.decimals,
        rawBalanceNumeric: new Numeric(assetBalance, 10),
      };
    }
  }

  return { balance: '0', decimals: 0, rawBalanceNumeric: new Numeric('0', 10) };
};

export const useBalance = () => {
  const { asset, chainId, from } = useSendContext();
  const tokenBalances = useSelector(getTokenBalances);
  const { isEvmSendType } = useSendType();
  const multichainBalances = useSelector(getMultichainBalances);
  const accountsByChainId = useSelector(
    (state: MetamaskSendState) => state.metamask.accountsByChainId,
  ) as AccountWithBalances;
  const accountsWithBalances = useMemo(() => {
    if (chainId && asset?.address && isEvmAddress(asset?.address)) {
      return accountsByChainId[chainId as Hex];
    }
    return undefined;
  }, [accountsByChainId, asset?.address, chainId]);

  const { balance, decimals, rawBalanceNumeric } = useMemo(() => {
    if (asset?.standard === ERC1155) {
      const bal = asset?.balance ?? '0';
      return {
        balance: bal,
        decimals: 0,
        rawBalanceNumeric: new Numeric(bal, 10),
      };
    }
    return getBalance({
      accountsWithBalances,
      asset,
      from,
      isEvmSendType,
      multichainBalances,
      tokenBalances,
    });
  }, [
    accountsWithBalances,
    asset,
    from,
    isEvmSendType,
    multichainBalances,
    tokenBalances,
  ]);

  return {
    balance,
    decimals,
    rawBalanceNumeric,
  };
};
