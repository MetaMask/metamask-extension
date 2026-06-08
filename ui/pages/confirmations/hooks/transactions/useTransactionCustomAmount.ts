import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { debounce, type DebouncedFunc } from 'lodash';
import { BigNumber } from 'bignumber.js';
import { Interface } from '@ethersproject/abi';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { setIsMaxAmount } from '../../../../store/controller-actions/transaction-pay-controller';
import { upsertTransactionUIMetricsFragment, updateTransaction } from '../../../../store/actions';
import { useTokenFiatRate } from '../tokens/useTokenFiatRates';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionPayToken } from '../pay/useTransactionPayToken';
import {
  useTransactionPayIsMaxAmount,
  useTransactionPayPrimaryRequiredToken,
} from '../pay/useTransactionPayData';
import { useTransactionAccountOverride } from '../pay/useTransactionAccountOverride';
import { getTokenAddress } from '../../utils/transaction-pay';
import { useUpdateTokenAmount } from './useUpdateTokenAmount';

export const MAX_LENGTH = 28;
const DEBOUNCE_DELAY = 500;
const ERC20_ABI = ['function transfer(address to, uint256 amount)'];
let erc20Interface: Interface | null = null;

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

  const dispatch = useDispatch();
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

  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();
  const accountOverride = useTransactionAccountOverride();

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
        const didSyncPostQuoteOverride =
          syncRequiredAssetsAndTransferDataAmount(
            transactionMeta,
            value,
            primaryRequiredToken?.decimals,
            accountOverride,
            dispatch,
          );

        if (!didSyncPostQuoteOverride) {
          updateTokenAmountCallback(value);

          if (transactionMeta?.requiredAssets?.length) {
            syncRequiredAssetsAmount(
              transactionMeta,
              value,
              primaryRequiredToken?.decimals,
              dispatch,
            );
          }
        }

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
  }, [accountOverride, disableUpdate, dispatch, primaryRequiredToken?.decimals, transactionId, transactionMeta, updateTokenAmountCallback]);

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
    (percentage: number) => {
      const balanceUsdValue = new BigNumber(String(balanceUsd ?? 0));

      if (!balanceUsdValue.isFinite() || balanceUsdValue.lte(0)) {
        return;
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
            mm_pay_amount_input_type: `${percentage}%`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            mm_pay_quote_requested: true,
          },
        });
      }

      setAmountFiat(newAmountFiat);

      const newAmountHuman = getAmountHumanFromFiat(
        newAmountFiat,
        tokenFiatRate,
        hasBalanceUsdOverride,
      );

      setAmountHumanDebounced(newAmountHuman);
      if (!disableUpdate) {
        const didSyncPostQuoteOverride =
          syncRequiredAssetsAndTransferDataAmount(
            transactionMeta,
            newAmountHuman,
            primaryRequiredToken?.decimals,
            accountOverride,
            dispatch,
          );

        if (!didSyncPostQuoteOverride) {
          updateTokenAmountCallback(newAmountHuman);
        }
      }
    },
    [
      accountOverride,
      balanceUsd,
      disableUpdate,
      dispatch,
      hasBalanceUsdOverride,
      isMaxAmount,
      primaryRequiredToken?.decimals,
      setIsMax,
      tokenFiatRate,
      transactionId,
      transactionMeta,
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

function getErc20Interface(): Interface {
  if (!erc20Interface) {
    erc20Interface = new Interface(ERC20_ABI);
  }

  return erc20Interface;
}

function syncRequiredAssetsAndTransferDataAmount(
  transactionMeta: TransactionMeta | undefined,
  amountHuman: string,
  decimals: number | undefined,
  accountOverride: Hex | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: any) => void,
): boolean {
  const existing = transactionMeta?.requiredAssets;
  if (!transactionMeta || !existing?.length || decimals === undefined || !accountOverride) {
    return false;
  }

  try {
    const amount = getAtomicAmountHex(amountHuman, decimals);
    const data = getErc20Interface().encodeFunctionData('transfer', [
      accountOverride,
      amount,
    ]) as Hex;
    const tokenAddress = existing[0].address as Hex;

    if (
      existing[0].amount === amount &&
      transactionMeta.txParams?.data === data &&
      (transactionMeta.txParams?.to as string | undefined)?.toLowerCase() ===
        tokenAddress.toLowerCase()
    ) {
      return true;
    }

    dispatch(
      updateTransaction(
        {
          ...transactionMeta,
          requiredAssets: [{ ...existing[0], amount }, ...existing.slice(1)],
          txParams: {
            ...transactionMeta.txParams,
            to: tokenAddress,
            data,
            value: '0x0',
          },
        },
        true,
      ),
    );

    return true;
  } catch (error) {
    console.error('Failed to sync post-quote transfer amount', error);
    return false;
  }
}

function getAtomicAmountHex(amountHuman: string, decimals: number): Hex {
  return `0x${new BigNumber(amountHuman)
    .times(new BigNumber(10).pow(decimals))
    .round(0, BigNumber.ROUND_UP)
    .toString(16)}` as Hex;
}

/**
 * Keeps `requiredAssets[0].amount` in sync with the entered amount.
 * Only fires when `requiredAssets` is already set — mirrors the mobile
 * `syncMoneyAccountDepositRequiredAssets` pattern.
 * @param transactionMeta
 * @param amountHuman
 * @param decimals
 * @param dispatch
 */
function syncRequiredAssetsAmount(
  transactionMeta: TransactionMeta,
  amountHuman: string,
  decimals: number | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: any) => void,
): void {
  const existing = transactionMeta.requiredAssets;
  if (!existing?.length || decimals === undefined) {
    return;
  }

  try {
    const amount = getAtomicAmountHex(amountHuman, decimals);

    if (existing[0].amount === amount) {
      return;
    }

    dispatch(
      updateTransaction(
        {
          ...transactionMeta,
          requiredAssets: [{ ...existing[0], amount }, ...existing.slice(1)],
        },
        true,
      ),
    );
  } catch (error) {
    console.error('Failed to sync requiredAssets amount', error);
  }
}
