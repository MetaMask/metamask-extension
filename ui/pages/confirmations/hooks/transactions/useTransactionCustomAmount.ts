import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce, type DebouncedFunc } from 'lodash';
import { BigNumber } from 'bignumber.js';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { setIsMaxAmount } from '../../../../store/controller-actions/transaction-pay-controller';
import { useTokenFiatRate } from '../tokens/useTokenFiatRates';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionPayToken } from '../pay/useTransactionPayToken';
import {
  useTransactionPayIsMaxAmount,
  useTransactionPayRequiredTokens,
} from '../pay/useTransactionPayData';
import { getTokenAddress } from '../../utils/transaction-pay';
import { useUpdateTokenAmount } from './useUpdateTokenAmount';

export const MAX_LENGTH = 28;
const DEBOUNCE_DELAY = 500;

export function useTransactionCustomAmount({
  currency,
  disableUpdate = false,
}: { currency?: string; disableUpdate?: boolean } = {}) {
  const [amountFiatState, setAmountFiat] = useState('0');
  const [isInputChanged, setInputChanged] = useState(false);
  const [hasInput, setHasInput] = useState(false);
  const [amountHumanDebounced, setAmountHumanDebounced] = useState('0');
  const requiredTokens = useTransactionPayRequiredTokens();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { chainId, id: transactionId } = transactionMeta ?? {};

  const isMaxAmount = useTransactionPayIsMaxAmount();
  const tokenAddress = getTokenAddress(transactionMeta);
  const tokenFiatRate =
    useTokenFiatRate(tokenAddress, chainId as Hex, currency) ?? 1;
  const balanceUsd = useTokenBalance();

  const { updateTokenAmount: updateTokenAmountCallback } =
    useUpdateTokenAmount();

  const debounceRef = useRef<DebouncedFunc<(value: string) => void> | null>(
    null,
  );

  const debounceSetAmountDelayed = useMemo(() => {
    debounceRef.current?.cancel();

    const debouncedFn = debounce((value: string) => {
      setAmountHumanDebounced(value);
      if (!disableUpdate) {
        updateTokenAmountCallback(value);
      }
    }, DEBOUNCE_DELAY);

    debounceRef.current = debouncedFn;
    return debouncedFn;
  }, [disableUpdate, updateTokenAmountCallback]);

  const primaryRequiredToken = useMemo(
    () => requiredTokens?.find((t) => !t.skipIfBalance),
    [requiredTokens],
  );

  const amountFiat = useMemo(() => {
    const targetAmountUsd = primaryRequiredToken?.amountUsd;

    if (isMaxAmount && targetAmountUsd && targetAmountUsd !== '0') {
      return new BigNumber(targetAmountUsd)
        .round(2, BigNumber.ROUND_HALF_UP)
        .toString(10);
    }

    return amountFiatState;
  }, [amountFiatState, isMaxAmount, primaryRequiredToken?.amountUsd]);

  const amountHuman = useMemo(
    () =>
      new BigNumber(amountFiat || '0')
        .dividedBy(String(tokenFiatRate))
        .toString(10),
    [amountFiat, tokenFiatRate],
  );

  useEffect(() => {
    debounceSetAmountDelayed(amountHuman);
  }, [amountHuman, debounceSetAmountDelayed]);

  useEffect(() => {
    return () => {
      debounceRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (amountHumanDebounced !== '0') {
      setInputChanged(true);
    }

    setHasInput(
      Boolean(amountHumanDebounced?.length) && amountHumanDebounced !== '0',
    );
  }, [amountHumanDebounced]);

  const setIsMax = useCallback(
    (value: boolean) => {
      if (transactionId) {
        setIsMaxAmount(transactionId, value);
      }
    },
    [transactionId],
  );

  const updatePendingAmount = useCallback(
    (value: string) => {
      let newAmount = value.replace(/^0+/u, '') || '0';

      if (newAmount.startsWith('.') || newAmount.startsWith(',')) {
        newAmount = `0${newAmount}`;
      }

      if (newAmount.length >= MAX_LENGTH) {
        return;
      }

      if (isMaxAmount) {
        setIsMax(false);
      }

      setAmountFiat(newAmount);
    },
    [isMaxAmount, setIsMax],
  );

  const updatePendingAmountPercentage = useCallback(
    (percentage: number) => {
      if (!balanceUsd) {
        return;
      }

      const newAmountFiat = new BigNumber(percentage)
        .dividedBy(100)
        .times(String(balanceUsd))
        .round(2, BigNumber.ROUND_DOWN)
        .toString(10);

      if (percentage === 100) {
        setIsMax(true);
      } else if (isMaxAmount) {
        setIsMax(false);
      }

      setAmountFiat(newAmountFiat);

      const newAmountHuman = new BigNumber(newAmountFiat || '0')
        .dividedBy(String(tokenFiatRate))
        .toString(10);

      setAmountHumanDebounced(newAmountHuman);
      if (!disableUpdate) {
        updateTokenAmountCallback(newAmountHuman);
      }
    },
    [
      balanceUsd,
      disableUpdate,
      isMaxAmount,
      setIsMax,
      tokenFiatRate,
      updateTokenAmountCallback,
    ],
  );

  return {
    amountFiat,
    amountHuman,
    amountHumanDebounced,
    hasInput,
    isInputChanged,
    updatePendingAmount,
    updatePendingAmountPercentage,
  };
}

function useTokenBalance() {
  const { payToken } = useTransactionPayToken();

  const payTokenBalanceUsd = new BigNumber(
    payToken?.balanceUsd ?? 0,
  ).toNumber();

  return payTokenBalanceUsd;
}
