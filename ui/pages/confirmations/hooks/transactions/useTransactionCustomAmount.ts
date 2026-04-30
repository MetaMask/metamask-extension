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
  useTransactionPayPrimaryRequiredToken,
} from '../pay/useTransactionPayData';
import { getTokenAddress } from '../../utils/transaction-pay';
import { useUpdateTokenAmount } from './useUpdateTokenAmount';

export const MAX_LENGTH = 28;
const DEBOUNCE_DELAY = 500;

export function useTransactionCustomAmount({
  currency,
  disableUpdate = false,
  balanceUsdOverride,
}: {
  currency?: string;
  disableUpdate?: boolean;
  /**
   * Optional caller-provided balance (USD) used as the source for
   * `updatePendingAmountPercentage`. When provided, takes precedence over the
   * default `payToken.balanceUsd`. Lets callers like Perps Withdraw supply a
   * non-pay-token balance (e.g. Perps available balance) without coupling the
   * shared hook to those flows.
   */
  balanceUsdOverride?: number;
} = {}) {
  const [isInputChanged, setInputChanged] = useState(false);
  const [hasInput, setHasInput] = useState(false);
  const [amountHumanDebounced, setAmountHumanDebounced] = useState('0');

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { chainId, id: transactionId } = transactionMeta ?? {};

  const isMaxAmount = useTransactionPayIsMaxAmount();
  const tokenAddress = getTokenAddress(transactionMeta);
  const tokenFiatRate =
    useTokenFiatRate(tokenAddress, chainId as Hex, currency) ?? 1;
  const balanceUsd = useTokenBalance(balanceUsdOverride);

  const { updateTokenAmount: updateTokenAmountCallback } =
    useUpdateTokenAmount();

  const debounceRef = useRef<DebouncedFunc<(value: string) => void> | null>(
    null,
  );

  // Create and update debounced function
  useEffect(() => {
    // Cancel any existing debounced calls
    debounceRef.current?.cancel();

    // Create new debounced function
    const debouncedFn = debounce((value: string) => {
      setAmountHumanDebounced(value);
      if (!disableUpdate) {
        updateTokenAmountCallback(value);
      }
    }, DEBOUNCE_DELAY);

    // Store in ref
    debounceRef.current = debouncedFn;

    // Cleanup: cancel on unmount or when dependencies change
    return () => {
      debouncedFn.cancel();
    };
  }, [disableUpdate, updateTokenAmountCallback]);

  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const [amountFiatState, setAmountFiat] = useState(
    new BigNumber(primaryRequiredToken?.amountUsd ?? '0')
      .round(2, BigNumber.ROUND_HALF_UP)
      .toString(10),
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
    // When isMaxAmount is true, amountHuman is driven by quote-controller updates
    // (primaryRequiredToken.amountUsd). Re-feeding it into updateTokenAmount
    // changes txParams.data, which restarts the quote cycle (infinite loop).
    // updatePendingAmountPercentage(100) already calls updateTokenAmountCallback
    // directly when MAX is first clicked.
    if (isMaxAmount) {
      return;
    }
    // Use ref directly to avoid re-running when callback is recreated
    if (debounceRef.current) {
      debounceRef.current(amountHuman);
    }
  }, [amountHuman, isMaxAmount]);

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

function useTokenBalance(balanceUsdOverride?: number) {
  const { payToken } = useTransactionPayToken();

  if (balanceUsdOverride !== undefined) {
    return balanceUsdOverride;
  }

  const payTokenBalanceUsd = new BigNumber(
    payToken?.balanceUsd ?? 0,
  ).toNumber();

  return payTokenBalanceUsd;
}
