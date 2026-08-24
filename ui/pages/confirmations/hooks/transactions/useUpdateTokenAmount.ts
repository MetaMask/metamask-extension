import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { Interface } from '@ethersproject/abi';
import { useConfirmContext } from '../../context/confirm';
import { usePrevious } from '../../../../hooks/usePrevious';
import { getMaybeSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import {
  selectTransactionPayAccountOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
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
    moneyAccountDisplayedAmount,
    setMoneyAccountDisplayedAmount,
    setMoneyAccountCommittedAmount,
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

  const accountOverride = useSelector((state: TransactionPayState) =>
    selectTransactionPayAccountOverrideByTransactionId(state, transactionId),
  );
  const selectedAccount = useSelector(getMaybeSelectedInternalAccount);

  // The account the withdrawal confirmation displays as the destination: the
  // Pay override once the user picks one in the account row, otherwise the
  // selected account the background falls back to. Tracked through the
  // displayed/committed gate alongside the amount, so Confirm stays disabled
  // until the calldata pays the account on screen.
  const withdrawRecipient =
    moneyAccountFlow === MoneyAccountFlow.Withdraw
      ? (accountOverride ??
        (selectedAccount && isEvmAccountType(selectedAccount.type)
          ? selectedAccount.address
          : undefined))
      : undefined;

  // Records the amount (and, for withdrawals, the recipient) the user
  // currently sees, the moment an edit is scheduled (see
  // `useTransactionCustomAmount`). Confirm stays disabled until the same
  // values come back through `setMoneyAccountCommittedAmount`, so a dropped
  // debounce, a failed commit, or overlapping edits all leave Confirm
  // disabled instead of signable against stale calldata. Idempotent for
  // repeated identical values, so the scheduling call and the eventual
  // commit recording the same values is harmless.
  const markAmountAsDisplayed = useCallback(
    (amountHuman: string) => {
      if (moneyAccountFlow === undefined) {
        return;
      }
      setMoneyAccountDisplayedAmount(
        amountHuman,
        transactionId,
        withdrawRecipient,
      );
    },
    [
      moneyAccountFlow,
      setMoneyAccountDisplayedAmount,
      transactionId,
      withdrawRecipient,
    ],
  );

  const commitWithdrawAmount = useCallback(
    (amountHuman: string) => {
      setMoneyAccountDisplayedAmount(
        amountHuman,
        transactionId,
        withdrawRecipient,
      );
      updateMoneyAccountWithdrawAmount(transactionId, amountHuman)
        .then((result) => {
          if (result.didCommit) {
            setMoneyAccountCommittedAmount(
              amountHuman,
              transactionId,
              result.recipient,
            );
          }
        })
        .catch((error) => {
          // Deliberately no committed-amount update: displayed !== committed
          // keeps Confirm disabled rather than signable against calldata
          // that still encodes the previous amount or recipient.
          console.error(
            'Failed to update money account withdrawal amount',
            error,
          );
        });
    },
    [
      setMoneyAccountCommittedAmount,
      setMoneyAccountDisplayedAmount,
      transactionId,
      withdrawRecipient,
    ],
  );

  const previousWithdrawRecipient = usePrevious(withdrawRecipient);

  // A recipient change (the account row, or the global selection) invalidates
  // the committed calldata exactly like an amount edit: re-mark and re-commit
  // the amount already entered so the transfer pays the account now shown.
  useEffect(() => {
    if (
      moneyAccountFlow !== MoneyAccountFlow.Withdraw ||
      previousWithdrawRecipient === undefined ||
      withdrawRecipient === previousWithdrawRecipient ||
      moneyAccountDisplayedAmount === undefined
    ) {
      return;
    }
    commitWithdrawAmount(moneyAccountDisplayedAmount);
  }, [
    commitWithdrawAmount,
    moneyAccountDisplayedAmount,
    moneyAccountFlow,
    previousWithdrawRecipient,
    withdrawRecipient,
  ]);

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
        setMoneyAccountDisplayedAmount(amountHuman, transactionId);
        updateMoneyAccountDepositAmount(transactionId, amountHuman)
          .then((didCommit) => {
            if (didCommit) {
              setMoneyAccountCommittedAmount(amountHuman, transactionId);
            }
          })
          .catch((error) => {
            // Deliberately no committed-amount update: displayed !==
            // committed keeps Confirm disabled rather than signable against
            // calldata that still encodes the previous amount.
            console.error(
              'Failed to update money account deposit amount',
              error,
            );
          });
        return;
      }

      // Same shape as deposits: the placeholder withdraw + transfer batch has
      // no calldata to parse, and the background commit path resolves the
      // recipient (the Pay override or the selected account) and the vault
      // rate.
      if (moneyAccountFlow === MoneyAccountFlow.Withdraw) {
        commitWithdrawAmount(amountHuman);
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
      commitWithdrawAmount,
      data,
      decimals,
      dispatch,
      moneyAccountFlow,
      nestedCallIndex,
      setMoneyAccountCommittedAmount,
      setMoneyAccountDisplayedAmount,
      to,
      transactionId,
    ],
  );

  return {
    isUpdating,
    markAmountAsDisplayed,
    updateTokenAmount,
  };
}
