import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce, type DebouncedFunc } from 'lodash';
import { BigNumber } from 'bignumber.js';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { setIsMaxAmount } from '../../../../store/controller-actions/transaction-pay-controller';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
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
  prefillMaxOnLoad = false,
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
  /**
   * When true, the amount field is pre-filled with the max balance once it is
   * available, unless the user has already edited it.
   */
  prefillMaxOnLoad?: boolean;
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
  const hasBalanceUsdOverride = balanceUsdOverride !== undefined;
  const balanceUsd = useTokenBalance(balanceUsdOverride);

  const { updateTokenAmount: updateTokenAmountCallback } =
    useUpdateTokenAmount();

  const debounceRef = useRef<DebouncedFunc<(value: string) => void> | null>(
    null,
  );
  const hasPrefilledMaxRef = useRef(false);
  const userEditedRef = useRef(false);

  // Create and update debounced function
  useEffect(() => {
    // Cancel any existing debounced calls
    debounceRef.current?.cancel();

    // Create new debounced function
    const debouncedFn = debounce((value: string) => {
      setAmountHumanDebounced(value);
      if (!disableUpdate) {
        updateTokenAmountCallback(value);
        // Emitted only after the debounce actually triggers a quote refresh
        // via updateEditableParams -> TransactionPayController:stateChange.
        if (transactionId) {
          upsertTransactionUIMetricsFragment(transactionId, {
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              mm_pay_quote_requested: true,
            },
          });
        }
      }
    }, DEBOUNCE_DELAY);

    // Store in ref
    debounceRef.current = debouncedFn;

    // Cleanup: cancel on unmount or when dependencies change
    return () => {
      debouncedFn.cancel();
    };
  }, [disableUpdate, transactionId, updateTokenAmountCallback]);

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
      getAmountHumanFromFiat(amountFiat, tokenFiatRate, hasBalanceUsdOverride),
    [amountFiat, hasBalanceUsdOverride, tokenFiatRate],
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
      // Record the manual edit synchronously so prefill can't overwrite it
      // before the debounced `isInputChanged` catches up.
      userEditedRef.current = true;

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

      if (transactionId) {
        upsertTransactionUIMetricsFragment(transactionId, {
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            mm_pay_amount_input_type: 'manual',
          },
        });
      }

      setAmountFiat(newAmount);
    },
    [isMaxAmount, setIsMax, transactionId],
  );

  const updatePendingAmountPercentage = useCallback(
    (
      percentage: number,
      { isPrefill = false }: { isPrefill?: boolean } = {},
    ) => {
      const balanceUsdValue = new BigNumber(String(balanceUsd ?? 0));

      if (!balanceUsdValue.isFinite() || balanceUsdValue.lte(0)) {
        return;
      }

      // A user-initiated percentage click counts as an edit so prefill won't
      // later override it.
      if (!isPrefill) {
        userEditedRef.current = true;
      }

      const newAmountFiatValue = new BigNumber(percentage)
        .dividedBy(100)
        .times(balanceUsdValue);
      const shouldSetMaxAmountMode =
        percentage === 100 && !hasBalanceUsdOverride;
      const newAmountFiat = (
        shouldSetMaxAmountMode || percentage !== 100
          ? newAmountFiatValue.round(2, BigNumber.ROUND_DOWN)
          : newAmountFiatValue
      ).toString(10);

      if (shouldSetMaxAmountMode) {
        setIsMax(true);
      } else if (isMaxAmount) {
        setIsMax(false);
      }

      if (transactionId) {
        upsertTransactionUIMetricsFragment(transactionId, {
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            mm_pay_amount_input_type: isPrefill
              ? 'prefilled_max'
              : `${percentage}%`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            mm_pay_quote_requested: true,
            // Record the USD amount prefilled at load so the controller metrics
            // builder can attach it to the executed transaction events.
            ...(isPrefill
              ? {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  mm_pay_prefilled_amount: Number(newAmountFiat),
                }
              : {}),
          },
        });
      }

      setAmountFiat(newAmountFiat);

      const newAmountHuman = getAmountHumanFromFiat(
        newAmountFiat,
        tokenFiatRate,
        hasBalanceUsdOverride,
      );

      // Percentage / prefill updates apply immediately, so drop any pending
      // debounced typing update that would otherwise overwrite them.
      debounceRef.current?.cancel();
      setAmountHumanDebounced(newAmountHuman);
      if (!disableUpdate) {
        updateTokenAmountCallback(newAmountHuman);
      }
    },
    [
      balanceUsd,
      disableUpdate,
      hasBalanceUsdOverride,
      isMaxAmount,
      setIsMax,
      tokenFiatRate,
      transactionId,
      updateTokenAmountCallback,
    ],
  );

  // Reset the prefill guards when the confirmation changes so a new
  // transaction in the same UI instance can prefill again.
  useEffect(() => {
    hasPrefilledMaxRef.current = false;
    userEditedRef.current = false;
  }, [transactionId]);

  // Pre-fill the max amount once the balance is known, unless the user has
  // already edited the field. `userEditedRef` is used instead of
  // `isInputChanged` because the latter also flips from debounced sync of
  // existing required-token USD, which would wrongly block prefill.
  useEffect(() => {
    if (
      !prefillMaxOnLoad ||
      hasPrefilledMaxRef.current ||
      userEditedRef.current ||
      !(balanceUsd > 0)
    ) {
      return;
    }
    hasPrefilledMaxRef.current = true;
    updatePendingAmountPercentage(100, { isPrefill: true });
  }, [prefillMaxOnLoad, balanceUsd, updatePendingAmountPercentage]);

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

function getAmountHumanFromFiat(
  amountFiat: string,
  tokenFiatRate: number,
  skipFiatRateConversion: boolean,
) {
  const amountFiatValue = new BigNumber(amountFiat || '0');

  if (skipFiatRateConversion) {
    return amountFiatValue.toString(10);
  }

  return amountFiatValue.dividedBy(String(tokenFiatRate)).toString(10);
}
