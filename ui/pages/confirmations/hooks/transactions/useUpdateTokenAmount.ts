import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { Interface } from '@ethersproject/abi';
import { useConfirmContext } from '../../context/confirm';
import { parseStandardTokenTransactionData } from '../../../../../shared/lib/transaction.utils';
import {
  getMoneyAccountFlow,
  MoneyAccountFlow,
} from '../../../../../shared/lib/money/money-account-flow';
import { getTokenTransferData } from '../../utils/transaction-pay';
import { updateEditableParams } from '../../../../store/actions';
import { updateAtomicBatchData } from '../../../../store/controller-actions/transaction-controller';
import {
  updateMoneyAccountDepositAmount,
  updateMoneyAccountWithdrawAmount,
} from '../../../../store/controller-actions/transaction-pay-controller';
import { useTransactionPayPrimaryRequiredToken } from '../pay/useTransactionPayData';
import { useDispatch } from '../../../../store/hooks';

const ERC20_ABI = ['function transfer(address to, uint256 amount)'];
let erc20Interface: Interface | null = null;

function getErc20Interface(): Interface {
  if (!erc20Interface) {
    erc20Interface = new Interface(ERC20_ABI);
  }
  return erc20Interface;
}

function calcTokenValue(value: string, decimals: number): BigNumber {
  const multiplier = new BigNumber(10).pow(decimals);
  return new BigNumber(String(value)).times(multiplier);
}

export function useUpdateTokenAmount() {
  const dispatch = useDispatch();
  const {
    currentConfirmation: transactionMeta,
    isMoneyAccountAmountCommitPending: isMoneyAmountCommitPending,
    setMoneyAccountAmountCommitPending,
  } = useConfirmContext<TransactionMeta>();

  const transactionId = transactionMeta?.id ?? '';
  const [previousAmountRaw, setPreviousAmountRaw] = useState<string>();

  const {
    data,
    to,
    index: nestedCallIndex,
  } = useMemo(
    () =>
      getTokenTransferData(transactionMeta) ?? {
        data: undefined,
        to: undefined,
        index: undefined,
      },
    [transactionMeta],
  );

  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const decimals = primaryRequiredToken?.decimals;

  const amountRaw = useMemo(() => {
    if (!data) {
      return '0';
    }
    const transactionData = parseStandardTokenTransactionData(data);
    const value = transactionData?.args?._value;
    if (!value) {
      return '0';
    }
    return new BigNumber(value.toString()).toString(10);
  }, [data]);

  const isUpdating =
    isMoneyAmountCommitPending ||
    (Boolean(previousAmountRaw) && amountRaw === previousAmountRaw);

  useEffect(() => {
    if (!isUpdating) {
      setPreviousAmountRaw(undefined);
    }
  }, [isUpdating, transactionId]);

  const moneyAccountFlow = useMemo(
    () => getMoneyAccountFlow(transactionMeta),
    [transactionMeta],
  );

  // Guards the pending count against double-counting: the debounce that
  // schedules a commit (see `useTransactionCustomAmount`) and the commit
  // itself both mark pending, but only one +1/-1 pair should ever reach
  // `setMoneyAccountAmountCommitPending` per edit cycle. Without this, N
  // keystrokes scheduling N debounced calls that coalesce into a single
  // eventual commit would push the count positive and never bring it back
  // to zero.
  const isPendingRef = useRef(false);

  const markAmountCommitPending = useCallback(() => {
    if (moneyAccountFlow === undefined || isPendingRef.current) {
      return;
    }
    isPendingRef.current = true;
    setMoneyAccountAmountCommitPending(true, transactionId);
  }, [moneyAccountFlow, setMoneyAccountAmountCommitPending, transactionId]);

  const clearAmountCommitPending = useCallback(() => {
    if (!isPendingRef.current) {
      return;
    }
    isPendingRef.current = false;
    setMoneyAccountAmountCommitPending(false, transactionId);
  }, [setMoneyAccountAmountCommitPending, transactionId]);

  const updateTokenAmount = useCallback(
    (amountHuman: string) => {
      // Money deposits are a placeholder approve + deposit batch with no
      // calldata to parse — the background commit path re-encodes both calls
      // (it needs a vault read for the share preview) and has its own
      // in-flight dedup, so `previousAmountRaw` tracking is not used here.
      // Mobile gates this behind the deposit-quote-pipeline flag with a
      // legacy per-call updater as the fallback; that legacy pipeline was
      // deliberately not ported, so this is the extension's only path.
      if (moneyAccountFlow === MoneyAccountFlow.Deposit) {
        markAmountCommitPending();
        updateMoneyAccountDepositAmount(transactionId, amountHuman)
          .catch((error) => {
            console.error(
              'Failed to update money account deposit amount',
              error,
            );
          })
          .finally(() => {
            clearAmountCommitPending();
          });
        return;
      }

      // Same shape as deposits: the placeholder withdraw + transfer batch has
      // no calldata to parse, and the background commit path resolves the
      // recipient (the selected account) and the vault rate.
      if (moneyAccountFlow === MoneyAccountFlow.Withdraw) {
        markAmountCommitPending();
        updateMoneyAccountWithdrawAmount(transactionId, amountHuman)
          .catch((error) => {
            console.error(
              'Failed to update money account withdrawal amount',
              error,
            );
          })
          .finally(() => {
            clearAmountCommitPending();
          });
        return;
      }

      if (!data || !to || decimals === undefined) {
        return;
      }

      const newAmountRaw = calcTokenValue(amountHuman, decimals).round(
        0,
        BigNumber.ROUND_UP,
      );

      if (newAmountRaw.eq(amountRaw)) {
        return;
      }

      const transactionData = parseStandardTokenTransactionData(data);
      const recipient = transactionData?.args?._to as string;

      const newData = getErc20Interface().encodeFunctionData('transfer', [
        recipient,
        `0x${newAmountRaw.toString(16)}`,
      ]) as Hex;

      setPreviousAmountRaw(amountRaw);

      if (nestedCallIndex !== undefined) {
        updateAtomicBatchData({
          transactionId,
          transactionIndex: nestedCallIndex,
          transactionData: newData,
        }).catch((error) => {
          console.error(
            'Failed to update token amount in nested transaction',
            error,
          );
        });

        return;
      }

      dispatch(
        updateEditableParams(transactionId, {
          data: newData,
          updateType: false,
        }),
      );
    },
    [
      amountRaw,
      clearAmountCommitPending,
      data,
      decimals,
      dispatch,
      markAmountCommitPending,
      moneyAccountFlow,
      nestedCallIndex,
      to,
      transactionId,
    ],
  );

  return {
    isUpdating,
    markAmountCommitPending,
    updateTokenAmount,
  };
}
