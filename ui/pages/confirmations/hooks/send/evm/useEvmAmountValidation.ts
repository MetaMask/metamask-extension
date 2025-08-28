import { Hex } from '@metamask/utils';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isNativeAddress } from '@metamask/bridge-controller';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Numeric } from '../../../../../../shared/modules/Numeric';
import { getTokenBalances } from '../../../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Asset } from '../../../types/send';
import { fromTokenMinimalUnitsNumeric } from '../../../utils/send';
import { useSendContext } from '../../../context/send';

type AccountWithBalances = Record<Hex, { balance: Hex }>;
type TokenBalances = Record<Hex, Record<Hex, Record<Hex, Hex>>>;
type MetamaskSendState = {
  metamask: { accountsByChainId: Record<Hex, AccountWithBalances> };
};
type ValidateAmountFnArgs = {
  accountsWithBalances?: AccountWithBalances;
  amount?: string;
  asset?: Asset;
  from: Hex;
  t: ReturnType<typeof useI18nContext>;
  tokenBalances: TokenBalances;
};

const validateAmountFn = ({
  accountsWithBalances,
  amount,
  asset,
  from,
  t,
  tokenBalances,
}: ValidateAmountFnArgs): string | undefined => {
  if (!asset || !amount) {
    return undefined;
  }
  let weiValue;
  let weiBalance;
  if (isNativeAddress(asset.address)) {
    if (!accountsWithBalances) {
      return undefined;
    }
    const accountAddress = Object.keys(accountsWithBalances).find(
      (address) => address.toLowerCase() === from.toLowerCase(),
    ) as Hex;
    const account = accountsWithBalances[accountAddress];
    try {
      weiValue = fromTokenMinimalUnitsNumeric(amount, asset.decimals);
    } catch (error) {
      console.log(error);
      return t('invalidValue');
    }
    weiBalance = new Numeric(account?.balance ?? '0', 16);
  } else {
    weiValue = fromTokenMinimalUnitsNumeric(amount, asset.decimals ?? 0);
    weiBalance = new Numeric(
      (
        Object.values(tokenBalances[from as Hex]).find(
          (chainTokenBalances: Record<Hex, Hex>) =>
            chainTokenBalances?.[asset?.address as Hex],
        ) as Record<Hex, Hex>
      )?.[asset?.address as Hex],
      16,
    );
  }
  if (weiBalance.lessThan(weiValue)) {
    return t('insufficientFundsSend');
  }
  return undefined;
};

export const useEvmAmountValidation = () => {
  const t = useI18nContext();
  const tokenBalances = useSelector(getTokenBalances);
  const { asset, chainId, from, value } = useSendContext();
  const accountsByChainId = useSelector(
    (state: MetamaskSendState) => state.metamask.accountsByChainId,
  ) as AccountWithBalances;
  const accountsWithBalances = useMemo(() => {
    if (chainId && asset?.address && isEvmAddress(asset?.address)) {
      return accountsByChainId[chainId as Hex];
    }
    return undefined;
  }, [accountsByChainId, asset?.address, chainId]);

  const validateEvmAmount = useCallback(
    () =>
      validateAmountFn({
        accountsWithBalances,
        amount: value,
        asset,
        tokenBalances,
        from: from as Hex,
        t,
      }),
    [accountsWithBalances, asset, from, t, tokenBalances, value],
  );

  return { validateEvmAmount };
};
