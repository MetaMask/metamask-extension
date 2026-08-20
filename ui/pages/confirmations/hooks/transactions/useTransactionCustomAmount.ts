import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce, type DebouncedFunc } from 'lodash';
import { BigNumber } from 'bignumber.js';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { setIsMaxAmount } from '../../../../store/controller-actions/transaction-pay-controller';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { useTokenFiatRate } from '../tokens/useTokenFiatRates';
import { useConfirmContext } from '../../context/confirm';
import { usePayWithNoFeeToken } from '../pay/usePayWithNoFeeToken';
import { useTransactionPayToken } from '../pay/useTransactionPayToken';
import {
  useTransactionPayIsMaxAmount,
  useTransactionPayPrimaryRequiredToken,
} from '../pay/useTransactionPayData';
import { getTokenAddress } from '../../utils/transaction-pay';
import { useDepositPrefillAmount } from './useDepositPrefillAmount';
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
  const { payToken } = useTransactionPayToken();
  const balanceUsd = getTokenBalanceUsd(balanceUsdOverride, payToken);
  const { isNoFeeToken } = usePayWithNoFeeToken();
  const isNoFeePayToken = Boolean(
    payToken && isNoFeeToken(payToken.address, String(payToken.chainId)),
  );

  const { updateTokenAmount: updateTokenAmountCallback } =
    useUpdateTokenAmount();

  const debounceRef = useRef<DebouncedFunc<(value: string) => void> | null>(
    null,
  );
  const hasPrefilledMaxRef = useRef(false);
  const userEditedRef = useRef(false);
  // Full-precision human amount from payToken.balanceRaw for money-account
  // deposit Max. Bypasses the lossy fiat roundtrip (ROUND_DOWN → ÷ rate →
  // ROUND_UP) that can request more than the wallet holds. Matches mobile
  // `depositMaxHumanRef`. Never paired with isMaxAmount on this flow.
  const depositMaxHumanRef = useRef<string | null>(null);
  // Mirrors `userEditedRef` for render-time use: the ref is needed to block
  // prefill synchronously, before the next render, while the state is what the
  // loading flag below can safely read. Stored as the edited transaction id so
  // a new confirmation clears it without an extra effect.
  const [editedTransactionId, setEditedTransactionId] = useState<
    string | undefined
  >(undefined);
  const hasUserEditedAmount =
    editedTransactionId !== undefined && editedTransactionId === transactionId;
  const isMoneyAccountDeposit = hasTransactionType(transactionMeta, [
    TransactionType.moneyAccountDeposit,
  ]);
  const depositPrefill = useDepositPrefillAmount();
  const shouldUseDepositPrefill =
    isMoneyAccountDeposit && depositPrefill.enabled;
  const prevDepositHasPrefilledRef = useRef(depositPrefill.hasPrefilled);

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

  // Undebounced counterpart to `hasInput`. Quote-derived results (fee,
  // estimated time, total) must disappear the moment the field is cleared
  // rather than lingering for the debounce window on a stale quote, so they
  // are gated on this instead of `hasInput`.
  const hasAmount = useMemo(() => {
    const value = new BigNumber(amountFiat || '0');
    return value.isFinite() && value.gt(0);
  }, [amountFiat]);

  // The raw-balance Max amount is token-specific and must not be reused after
  // a Pay with switch. A user-typed USD amount is not: deposit prefill already
  // recomputes on token change and only skips overwrite when userEditedRef is
  // set, so clearing that ref would replace the typed value with 50%/100%.
  useEffect(() => {
    depositMaxHumanRef.current = null;
  }, [payToken?.address, payToken?.chainId]);

  useEffect(() => {
    // When isMaxAmount is true, amountHuman is driven by quote-controller updates
    // (primaryRequiredToken.amountUsd). Re-feeding it into updateTokenAmount
    // changes txParams.data, which restarts the quote cycle (infinite loop).
    // updatePendingAmountPercentage(100) already calls updateTokenAmountCallback
    // directly when MAX is first clicked.
    if (isMaxAmount) {
      return;
    }
    // Use ref directly to avoid re-running when callback is recreated.
    // Deposit Max keeps the raw-balance human amount so the fiat-derived
    // `amountHuman` cannot overwrite it after debounce.
    if (debounceRef.current) {
      debounceRef.current(depositMaxHumanRef.current ?? amountHuman);
    }
  }, [amountHuman, isMaxAmount, payToken?.address, payToken?.chainId]);

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
      setEditedTransactionId(transactionId);

      // The input allows a comma as decimal separator, but BigNumber throws
      // on commas, so normalize it to a dot before it reaches state.
      let newAmount = value.replace(',', '.').replace(/^0+/u, '') || '0';

      if (newAmount.startsWith('.')) {
        newAmount = `0${newAmount}`;
      }

      if (newAmount.length >= MAX_LENGTH) {
        return;
      }

      if (isMaxAmount) {
        setIsMax(false);
      }

      depositMaxHumanRef.current = null;

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
        setEditedTransactionId(transactionId);
      }

      const newAmountFiatValue = new BigNumber(percentage)
        .dividedBy(100)
        .times(balanceUsdValue);
      // Money-account deposits never set isMaxAmount (matches mobile keypad
      // Max for this flow). TPC would otherwise substitute token.balanceRaw
      // and the displayed fiat would jump to the quote target.
      const shouldSetMaxAmountMode =
        percentage === 100 && !hasBalanceUsdOverride && !isMoneyAccountDeposit;
      // Keep the displayed fiat rounded except for balanceUsdOverride Max
      // (Perps withdraw), which must preserve the full typed balance.
      const newAmountFiat = (
        hasBalanceUsdOverride && percentage === 100
          ? newAmountFiatValue
          : newAmountFiatValue.round(2, BigNumber.ROUND_DOWN)
      ).toString(10);

      if (shouldSetMaxAmountMode) {
        setIsMax(true);
      } else if (isMaxAmount) {
        setIsMax(false);
      }

      // `updateTokenAmount` treats the human amount as the destination token
      // (mUSD), so the raw pay-token balance is only a valid Max amount for
      // no-fee (subsidised) sources, which convert 1:1. Max is only rendered
      // for those tokens; anything else uses the fiat conversion below.
      const isMaxMoneyAccountDeposit =
        percentage === 100 && isMoneyAccountDeposit && isNoFeePayToken;
      depositMaxHumanRef.current = isMaxMoneyAccountDeposit
        ? getHumanAmountFromBalanceRaw(payToken?.balanceRaw, payToken?.decimals)
        : null;

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

      const newAmountHuman =
        depositMaxHumanRef.current ??
        getAmountHumanFromFiat(
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
      isMoneyAccountDeposit,
      isNoFeePayToken,
      payToken?.balanceRaw,
      payToken?.decimals,
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

  const applyDepositPrefillAmount = useCallback(
    (fiatAmount: string) => {
      const balanceUsdValue = new BigNumber(String(balanceUsd ?? 0));
      const prefillFiat = new BigNumber(fiatAmount);

      if (
        !balanceUsdValue.isFinite() ||
        balanceUsdValue.lte(0) ||
        !prefillFiat.isFinite()
      ) {
        return;
      }

      // Money-account deposits keep isMaxAmount false (matches mobile) so the
      // typed fiat amount is what gets submitted, not the raw token balance.
      if (isMaxAmount) {
        setIsMax(false);
      }

      depositMaxHumanRef.current = null;

      if (transactionId) {
        upsertTransactionUIMetricsFragment(transactionId, {
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            mm_pay_amount_input_type: 'prefilled_max',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            mm_pay_quote_requested: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            mm_pay_prefilled_amount: Number(fiatAmount),
          },
        });
      }

      setAmountFiat(fiatAmount);

      const newAmountHuman = getAmountHumanFromFiat(
        fiatAmount,
        tokenFiatRate,
        hasBalanceUsdOverride,
      );

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

  // Money-account deposit prefill (feature-flagged). Re-applies when the pay
  // token or funding account changes, unless the user has edited the amount.
  // Only `hasPrefilled` is a dependency (matches mobile): balance updates on
  // the same token must not overwrite a committed prefill.
  useEffect(() => {
    if (!shouldUseDepositPrefill) {
      prevDepositHasPrefilledRef.current = depositPrefill.hasPrefilled;
      return;
    }

    // Skip if the user has manually typed — a transient hasPrefilled toggle
    // (from tokenKey changes) must not overwrite their input.
    if (userEditedRef.current) {
      prevDepositHasPrefilledRef.current = depositPrefill.hasPrefilled;
      return;
    }

    if (depositPrefill.hasPrefilled) {
      applyDepositPrefillAmount(depositPrefill.prefillAmount ?? '0');
    } else if (prevDepositHasPrefilledRef.current) {
      setAmountFiat('0');
    }

    prevDepositHasPrefilledRef.current = depositPrefill.hasPrefilled;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [depositPrefill.hasPrefilled, shouldUseDepositPrefill]);

  // Pre-fill the max amount once the balance is known, unless the user has
  // already edited the field. `userEditedRef` is used instead of
  // `isInputChanged` because the latter also flips from debounced sync of
  // existing required-token USD, which would wrongly block prefill.
  // Skipped when deposit prefill handles money-account deposits.
  useEffect(() => {
    if (
      shouldUseDepositPrefill ||
      !prefillMaxOnLoad ||
      hasPrefilledMaxRef.current ||
      userEditedRef.current ||
      !(balanceUsd > 0)
    ) {
      return;
    }
    hasPrefilledMaxRef.current = true;
    updatePendingAmountPercentage(100, { isPrefill: true });
  }, [
    balanceUsd,
    prefillMaxOnLoad,
    shouldUseDepositPrefill,
    updatePendingAmountPercentage,
  ]);

  return {
    amountFiat,
    amountHuman,
    amountHumanDebounced,
    hasAmount,
    hasInput,
    isDepositPrefillEnabled: shouldUseDepositPrefill,
    // A pay token or funding account change restarts the prefill computation,
    // but the result is discarded once the user has typed, so reporting it as
    // loading would swap their amount for a skeleton and back again.
    isDepositPrefillLoading:
      shouldUseDepositPrefill &&
      depositPrefill.isLoading &&
      !hasUserEditedAmount,
    isDepositPrefilled: shouldUseDepositPrefill && depositPrefill.hasPrefilled,
    isInputChanged,
    updatePendingAmount,
    updatePendingAmountPercentage,
  };
}

function getTokenBalanceUsd(
  balanceUsdOverride: number | undefined,
  payToken: ReturnType<typeof useTransactionPayToken>['payToken'],
) {
  if (balanceUsdOverride !== undefined) {
    return balanceUsdOverride;
  }

  return new BigNumber(payToken?.balanceUsd ?? 0).toNumber();
}

function getHumanAmountFromBalanceRaw(
  balanceRaw?: string,
  decimals?: number,
): string | null {
  if (!balanceRaw) {
    return null;
  }

  const humanAmount = new BigNumber(balanceRaw).dividedBy(
    new BigNumber(10).pow(decimals ?? 6),
  );

  if (!humanAmount.isFinite() || humanAmount.lte(0)) {
    return null;
  }

  return humanAmount.toString(10);
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
