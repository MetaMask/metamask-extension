import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { debounce, type DebouncedFunc } from 'lodash';
import { BigNumber } from 'bignumber.js';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import {
  setIsMaxAmount,
  setLastMoneyAccountWithdrawAmount,
} from '../../../../store/controller-actions/transaction-pay-controller';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { useMoneyAccountWithdrawableFiat } from '../../../../hooks/money/useMoneyAccountWithdrawableFiat';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useTokenFiatRate } from '../tokens/useTokenFiatRates';
import { useConfirmContext } from '../../context/confirm';
import { usePayWithNoFeeToken } from '../pay/usePayWithNoFeeToken';
import { useTransactionPayToken } from '../pay/useTransactionPayToken';
import { usePayTokenAccountBalance } from '../pay/usePayTokenAccountBalance';
import {
  useTransactionPayIsMaxAmount,
  useTransactionPayPrimaryRequiredToken,
  useTransactionPayTotals,
} from '../pay/useTransactionPayData';
import { getTokenAddress } from '../../utils/transaction-pay';
import {
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
  MUSD_TOKEN_ADDRESS,
} from '../../constants/musd';
import { useDepositPrefillAmount } from './useDepositPrefillAmount';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';
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
  const [amountHumanDebounced, setAmountHumanDebounced] = useState('0');

  const { currentConfirmation: transactionMeta, setIsMaxMoneyDeposit } =
    useConfirmContext<TransactionMeta>();
  const { chainId, id: transactionId } = transactionMeta ?? {};

  const isMaxAmount = useTransactionPayIsMaxAmount();
  const isMoneyAccountDeposit = hasTransactionType(transactionMeta, [
    TransactionType.moneyAccountDeposit,
  ]);
  const isMoneyAccountWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.moneyAccountWithdraw,
  ]);
  const tokenAddress = getTokenAddress(transactionMeta);
  const payTokenFiatRate = useTokenFiatRate(
    tokenAddress,
    chainId as Hex,
    currency,
  );
  const musdFiatRate =
    useTokenFiatRate(
      MUSD_TOKEN_ADDRESS,
      MUSD_CONVERSION_DEFAULT_CHAIN_ID,
      currency,
    ) ?? 1;
  // Deposit/withdraw amounts are human mUSD and the input is USD. The
  // confirmation `to` is the vault on Monad, so `payTokenFiatRate` is the
  // MON rate and inflates every non-Max amount past the pay-token balance.
  const tokenFiatRate =
    isMoneyAccountDeposit || isMoneyAccountWithdraw
      ? musdFiatRate
      : (payTokenFiatRate ?? 1);
  const hasBalanceUsdOverride = balanceUsdOverride !== undefined;
  const balanceUsd = usePayTokenBalanceUsd(balanceUsdOverride);
  // Live funding-account raw balance — payToken.balanceRaw is a controller
  // snapshot that can be 0/stale on money-account deposits (tx `from` is the
  // vault). Prefill often runs before that snapshot updates; Max later works
  // once it does. Prefer live raw so prefill matches Max.
  const { balanceRaw: livePayTokenBalanceRaw } = usePayTokenAccountBalance();

  const { payToken } = useTransactionPayToken();
  const accountOverride = useTransactionAccountOverride();
  const { isNoFeeToken } = usePayWithNoFeeToken();
  const isNoFeePayToken = Boolean(
    payToken && isNoFeeToken(payToken.address, String(payToken.chainId)),
  );

  const { updateTokenAmount: updateTokenAmountCallback } =
    useUpdateTokenAmount();
  const totals = useTransactionPayTotals();

  const debounceRef = useRef<DebouncedFunc<(value: string) => void> | null>(
    null,
  );
  const hasPrefilledMaxRef = useRef(false);
  const userEditedRef = useRef(false);
  // Full-precision human amount from payToken.balanceRaw for money-account
  // deposit Max and no-fee percentage chips. Bypasses the lossy fiat
  // roundtrip (ROUND_DOWN → ÷ rate → ROUND_UP) that can request more than the
  // wallet holds. The controller's isMaxAmount path uses the same raw
  // payment-token balance for 100%.
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
      // Same as mobile: a zero transfer must not update tx data or request
      // quotes. TransactionPayController skips zero required amounts, but
      // writing 0 still kicks the quote pipeline.
      if (disableUpdate || isZeroHumanAmount(value)) {
        return;
      }

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
    }, DEBOUNCE_DELAY);

    // Store in ref
    debounceRef.current = debouncedFn;

    // Cleanup: cancel on unmount or when dependencies change
    return () => {
      debouncedFn.cancel();
    };
  }, [disableUpdate, transactionId, updateTokenAmountCallback]);

  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();
  const isInputBased = totals?.isInputBased === true;
  // A remounted input-based confirmation must restore the source total, not
  // the post-fee target amount stored on the required token.
  const initialAmountUsd = isInputBased
    ? totals.sourceAmount.usd
    : primaryRequiredToken?.amountUsd;

  const [amountFiatState, setAmountFiat] = useState(
    new BigNumber(initialAmountUsd ?? '0')
      .round(2, BigNumber.ROUND_HALF_UP)
      .toString(10),
  );

  const amountFiat = useMemo(() => {
    // Quote target USD is the amount that will actually land after fees —
    // use it for Max display so the field matches the submitted total.
    // Withdrawals: target USD is destination-received value after bridge
    // fees, not the mUSD being withdrawn — keep the typed amount.
    // For input-based quotes, the quote target is the amount received after
    // fees, not the total source amount selected by Max.
    const targetAmountUsd = totals?.targetAmount?.usd;

    if (
      !isInputBased &&
      !isMoneyAccountWithdraw &&
      isMaxAmount &&
      targetAmountUsd &&
      targetAmountUsd !== '0'
    ) {
      return new BigNumber(targetAmountUsd)
        .round(2, BigNumber.ROUND_HALF_UP)
        .toString(10);
    }

    return amountFiatState;
  }, [
    amountFiatState,
    isInputBased,
    isMaxAmount,
    isMoneyAccountWithdraw,
    totals?.targetAmount?.usd,
  ]);

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

  // Pay-with / funding-account switches are token-specific: drop the raw Max
  // human amount and clear the edit guard so deposit prefill can re-apply the
  // new token's 50%/100%. Typed amounts only stick for the current token.
  useEffect(() => {
    depositMaxHumanRef.current = null;
    userEditedRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear edit guard so the new token can prefill
    setEditedTransactionId(undefined);
    // The new token re-prefills and re-asserts Max mode if applicable.
    setIsMaxMoneyDeposit?.(false);
  }, [
    payToken?.address,
    payToken?.chainId,
    accountOverride,
    setIsMaxMoneyDeposit,
  ]);

  useEffect(() => {
    // Record immediately so Send is enabled and confirm can encode without
    // waiting for the 500ms debounce that writes calldata.
    if (isMoneyAccountWithdraw && transactionId) {
      setLastMoneyAccountWithdrawAmount(transactionId, amountHuman);
    }

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
  }, [
    amountHuman,
    isMaxAmount,
    isMoneyAccountWithdraw,
    payToken?.address,
    payToken?.chainId,
    transactionId,
  ]);

  if (!isInputChanged && amountHumanDebounced !== '0') {
    setInputChanged(true);
  }

  const hasInput =
    Boolean(amountHumanDebounced?.length) && amountHumanDebounced !== '0';

  const setIsMax = useCallback(
    (value: boolean) => {
      if (transactionId) {
        setIsMaxAmount(transactionId, value, { isMoneyAccountDeposit });
      }
    },
    [isMoneyAccountDeposit, transactionId],
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

      // A manual edit is no longer the full-balance Max deposit.
      setIsMaxMoneyDeposit?.(false);

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
    [isMaxAmount, setIsMax, setIsMaxMoneyDeposit, transactionId],
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

      // Track full-balance (100%) money-account deposits so the insufficient-
      // balance alert can tolerate the bridge spread / quote rounding the same
      // way it does for `isMaxAmount` Pay flows. Any smaller percentage is an
      // explicit sub-max amount and must still surface a real shortfall.
      if (isMoneyAccountDeposit) {
        setIsMaxMoneyDeposit?.(percentage === 100);
      }

      const newAmountFiatValue = new BigNumber(percentage)
        .dividedBy(100)
        .times(balanceUsdValue);
      // Money-account deposits never set isMaxAmount — Max / uncapped prefill
      // submit exact pay-token balanceRaw as requiredAssets instead.
      // Do not set isMaxAmount for money-account withdraw either: the
      // background cannot synchronously read the UI's vault-withdrawable
      // balance override, so the already-typed amount remains authoritative.
      const shouldSetMaxAmountMode =
        percentage === 100 &&
        !hasBalanceUsdOverride &&
        !isMoneyAccountDeposit &&
        !isMoneyAccountWithdraw;
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
      // (mUSD), so the raw pay-token balance is only a valid amount for
      // no-fee (subsidised) sources, which convert 1:1. Uncapped 100% deposit
      // prefill uses the same raw path even if the no-fee flag is briefly
      // false on first paint — otherwise fiat conversion overshoots and Max
      // later works only because isNoFee is then true.
      // Prefer the lesser of live vs snapshot raw so the submitted amount
      // never exceeds either balance.
      const isRawMoneyAccountDeposit =
        isMoneyAccountDeposit &&
        (isNoFeePayToken || (isPrefill && percentage === 100));
      const depositMaxBalanceRaw = getPreferredPayTokenBalanceRaw(
        livePayTokenBalanceRaw,
        payToken?.balanceRaw,
      );
      if (!isRawMoneyAccountDeposit) {
        depositMaxHumanRef.current = null;
      } else if (percentage === 100) {
        depositMaxHumanRef.current = getHumanAmountFromBalanceRaw(
          depositMaxBalanceRaw,
          payToken?.decimals,
        );
      } else {
        depositMaxHumanRef.current = getHumanAmountFromBalanceRawPercentage(
          depositMaxBalanceRaw,
          payToken?.decimals,
          percentage,
        );
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
      if (!disableUpdate && !isZeroHumanAmount(newAmountHuman)) {
        updateTokenAmountCallback(newAmountHuman);
      }
    },
    [
      balanceUsd,
      disableUpdate,
      hasBalanceUsdOverride,
      isMaxAmount,
      isMoneyAccountDeposit,
      isMoneyAccountWithdraw,
      isNoFeePayToken,
      livePayTokenBalanceRaw,
      payToken?.balanceRaw,
      payToken?.decimals,
      setIsMax,
      setIsMaxMoneyDeposit,
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

      if (!balanceUsdValue.isFinite() || !prefillFiat.isFinite()) {
        return;
      }

      // Capped / 50% / literal prefills are not a full-balance Max deposit.
      setIsMaxMoneyDeposit?.(false);

      // $0 pay token: show 0.0 so the field is usable. Do not request a quote.
      if (balanceUsdValue.lte(0)) {
        if (isMaxAmount) {
          setIsMax(false);
        }
        depositMaxHumanRef.current = null;
        setAmountFiat(fiatAmount);
        debounceRef.current?.cancel();
        setAmountHumanDebounced('0');
        return;
      }

      // Limit-capped / literal prefills are not a true Max. Uncapped 100%
      // prefills go through `updatePendingAmountPercentage` instead.
      if (isMaxAmount) {
        setIsMax(false);
      }

      depositMaxHumanRef.current = null;

      setAmountFiat(fiatAmount);

      const newAmountHuman = getAmountHumanFromFiat(
        fiatAmount,
        tokenFiatRate,
        hasBalanceUsdOverride,
      );

      debounceRef.current?.cancel();
      setAmountHumanDebounced(newAmountHuman);
      if (disableUpdate || isZeroHumanAmount(newAmountHuman)) {
        return;
      }

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

      updateTokenAmountCallback(newAmountHuman);
    },
    [
      balanceUsd,
      disableUpdate,
      hasBalanceUsdOverride,
      isMaxAmount,
      setIsMax,
      setIsMaxMoneyDeposit,
      tokenFiatRate,
      transactionId,
      updateTokenAmountCallback,
    ],
  );

  // Money-account deposit prefill (feature-flagged). Re-applies when the pay
  // token or funding account changes (edit guard cleared above). Only
  // `hasPrefilled` is a dependency (matches mobile): balance updates on the
  // same token must not overwrite a committed prefill.
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
      // Uncapped 100% (stablecoin) submits exact balanceRaw as requiredAssets
      // (never isMaxAmount). The fiat literal path can ROUND_UP past available
      // balance and yield "No quotes".
      if (depositPrefill.isUncappedMaxPrefill) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- apply deposit prefill when hasPrefilled commits
        updatePendingAmountPercentage(100, { isPrefill: true });
      } else {
        applyDepositPrefillAmount(depositPrefill.prefillAmount ?? '0');
      }
    } else if (prevDepositHasPrefilledRef.current) {
      setAmountFiat('0.0');
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
    // Hide the skeleton after a manual edit on the *current* token. A pay
    // token / funding account change clears the edit guard so loading (and
    // the new prefill) can show again.
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

function usePayTokenBalanceUsd(balanceUsdOverride?: number) {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const transactionId = transactionMeta?.id ?? '';
  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId),
  );
  const isMoneyPaymentOverride =
    paymentOverride === PaymentOverride.MoneyAccount;
  const { withdrawableFiatRaw } = useMoneyAccountWithdrawableFiat(
    isMoneyPaymentOverride,
  );
  const { balanceUsd } = usePayTokenAccountBalance();

  if (balanceUsdOverride !== undefined) {
    return balanceUsdOverride;
  }

  if (isMoneyPaymentOverride) {
    if (!withdrawableFiatRaw) {
      return 0;
    }
    // ROUND_DOWN to cents before Max/percentage math so we never set an
    // amount above the spendable withdrawable balance after display rounding.
    // `round(dp, rm)`, not `decimalPlaces`: this repo pins `bignumber.js@4`
    // where `decimalPlaces` is a getter that returns the place *count*.
    return new BigNumber(withdrawableFiatRaw)
      .round(2, BigNumber.ROUND_DOWN)
      .toNumber();
  }

  return new BigNumber(balanceUsd ?? 0).toNumber();
}

function getPreferredPayTokenBalanceRaw(
  liveBalanceRaw?: string,
  snapshotBalanceRaw?: string,
): string | undefined {
  const live =
    liveBalanceRaw && !new BigNumber(liveBalanceRaw).isZero()
      ? new BigNumber(liveBalanceRaw)
      : null;
  const snapshot =
    snapshotBalanceRaw && !new BigNumber(snapshotBalanceRaw).isZero()
      ? new BigNumber(snapshotBalanceRaw)
      : null;

  // When both are known, use the smaller so the submitted Max/prefill amount
  // never exceeds the TPC payment-token snapshot (isMax source) or the live
  // wallet balance — mismatch here is a common first-open "No quotes".
  if (live && snapshot) {
    return BigNumber.min(live, snapshot).toFixed(0);
  }
  if (live) {
    return live.toFixed(0);
  }
  if (snapshot) {
    return snapshot.toFixed(0);
  }
  return undefined;
}

function getHumanAmountFromBalanceRaw(
  balanceRaw?: string,
  decimals?: number,
): string | null {
  if (!balanceRaw || new BigNumber(balanceRaw).isZero()) {
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

/**
 * Exact human amount for a percentage of a raw token balance.
 * Rounds the raw portion down so the request never exceeds `balanceRaw`.
 *
 * @param balanceRaw - Token balance in base units.
 * @param decimals - Token decimals (defaults to 6 for mUSD).
 * @param percentage - Percent of balance to take (0-100).
 * @returns Human amount string, or null when the balance is unusable.
 */
function getHumanAmountFromBalanceRawPercentage(
  balanceRaw: string | undefined,
  decimals: number | undefined,
  percentage: number,
): string | null {
  if (!balanceRaw || new BigNumber(balanceRaw).isZero() || percentage <= 0) {
    return null;
  }

  const tokenDecimals = decimals ?? 6;
  const rawPortion = new BigNumber(balanceRaw)
    .times(percentage)
    .dividedBy(100)
    .round(0, BigNumber.ROUND_DOWN);

  if (rawPortion.lte(0)) {
    return null;
  }

  return rawPortion
    .dividedBy(new BigNumber(10).pow(tokenDecimals))
    .toString(10);
}

function isZeroHumanAmount(value: string): boolean {
  const amount = new BigNumber(value || 0);
  return !amount.isFinite() || amount.lte(0);
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
