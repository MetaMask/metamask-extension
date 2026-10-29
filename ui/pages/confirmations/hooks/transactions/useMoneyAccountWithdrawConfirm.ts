import { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { useCallback } from 'react';

import { getMoneyAccountWithdrawTransferTarget } from '../../../../../shared/lib/money/withdraw-amount-commit';
import { isEqualCaseInsensitive } from '../../../../../shared/lib/string-utils';
import {
  selectTransactionById,
  type TransactionState,
} from '../../../../selectors/transactionController';
import {
  selectTransactionPaymentTokenByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { submitRequestToBackground } from '../../../../store/background-connection';
import {
  clearLastMoneyAccountWithdrawAmount,
  getLastMoneyAccountWithdrawAmount,
  updateMoneyAccountWithdrawAmount,
} from '../../../../store/controller-actions/transaction-pay-controller';
import { useDispatch } from '../../../../store/hooks';
import type { MetaMaskReduxDispatch } from '../../../../store/types';
import {
  applyWithdrawCalldata,
  asFundedWithdrawUpdate,
  doesWithdrawCalldataMatchAmount,
  getMoneyAccountWithdrawTransferDetails,
  withFundedBatchCalldata,
} from '../../utils/money-account-withdraw';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';

async function persistWithdrawTransaction(
  transaction: TransactionMeta,
): Promise<void> {
  await submitRequestToBackground('updateTransaction', [transaction]);
}

async function finalizePreparedWithdraw(
  transaction: TransactionMeta,
): Promise<TransactionMeta> {
  await persistWithdrawTransaction(transaction);
  clearLastMoneyAccountWithdrawAmount(transaction.id);
  return transaction;
}

function readTransactionFromStore(
  dispatch: MetaMaskReduxDispatch,
  transactionId: string,
): TransactionMeta | undefined {
  return dispatch((_, getState) =>
    selectTransactionById(getState() as TransactionState, transactionId),
  );
}

/**
 * Prepares a Money Account withdrawal for approval.
 *
 * Withdraw placeholders have no calldata. Await the amount commit and approve
 * only a funded withdraw (nested transfer amount > 0). Never approve the
 * empty placeholder or `transfer(recipient, 0)` — both mine successfully
 * and move no funds.
 *
 * Nested calls can look funded while the parent still carries the empty
 * `execute()`. Rebuild `to` + `data` from those nested calls and persist
 * before approve so publish signs the real batch.
 *
 * The background encoder returns the two nested data hexes. The UI bridge
 * often strips a full TransactionMeta, so confirm patches those hexes onto
 * the confirmation clone instead of requiring the IPC object to be funded.
 *
 * Funded nested calldata is reused only when it already encodes the latest
 * typed amount and pays the current transfer target. Otherwise Send could
 * approve a previous encode for an older amount, recipient, or receive token.
 *
 * @returns An object with `prepareWithdrawTransaction`.
 */
export function useMoneyAccountWithdrawConfirm() {
  const dispatch = useDispatch();
  // Withdraws store the recipient in Pay's account override. It is only
  // encoded into the transfer calldata and never signs.
  const recipient = useTransactionAccountOverride();

  /**
   * Encodes (when needed) and returns the funded withdraw transaction to
   * approve, or `null` when it is not encoded.
   *
   * @param transactionMeta - Confirmation transaction to prepare.
   * @returns The funded transaction, or `null`.
   */
  const prepareWithdrawTransaction = useCallback(
    async (
      transactionMeta: TransactionMeta,
    ): Promise<TransactionMeta | null> => {
      const amountHuman = getLastMoneyAccountWithdrawAmount(transactionMeta.id);
      const fromStore = readTransactionFromStore(dispatch, transactionMeta.id);
      const paymentToken = dispatch((_, getState) =>
        selectTransactionPaymentTokenByTransactionId(
          getState() as unknown as TransactionPayState,
          transactionMeta.id,
        ),
      );

      // Skip re-encode only when nested calldata already matches the amount
      // on screen and pays the current target. Quoted tokens keep the mUSD on
      // the money account.
      const isReusable = (transaction: TransactionMeta | undefined) => {
        if (
          !transaction ||
          !doesWithdrawCalldataMatchAmount(transaction, amountHuman)
        ) {
          return false;
        }
        if (!recipient) {
          return true;
        }
        const target = getMoneyAccountWithdrawTransferTarget({
          moneyAccountAddress: transaction.txParams.from as Hex,
          paymentToken,
          recipient,
          transaction,
        });
        return isEqualCaseInsensitive(
          getMoneyAccountWithdrawTransferDetails(transaction).recipient ?? '',
          target,
        );
      };
      const ready =
        (isReusable(fromStore) ? withFundedBatchCalldata(fromStore) : null) ??
        (isReusable(transactionMeta)
          ? withFundedBatchCalldata(transactionMeta)
          : null);

      if (ready) {
        return finalizePreparedWithdraw(ready);
      }

      const hasAmount = Boolean(
        amountHuman && new BigNumber(amountHuman).gt(0),
      );

      if (!hasAmount) {
        console.error(
          'Money Account withdraw: no committed amount, refusing to approve placeholder',
          { transactionId: transactionMeta.id, amountHuman },
        );
        return null;
      }

      const rawUpdate = await updateMoneyAccountWithdrawAmount(
        transactionMeta.id,
        amountHuman as string,
        recipient,
      );
      const update = asFundedWithdrawUpdate(rawUpdate);
      if (update) {
        const applied =
          applyWithdrawCalldata(fromStore, update) ??
          applyWithdrawCalldata(transactionMeta, update);
        if (applied) {
          return finalizePreparedWithdraw(applied);
        }
      }

      const fromStoreAfterEncode = readTransactionFromStore(
        dispatch,
        transactionMeta.id,
      );
      // After encode, only accept store calldata that matches the typed amount.
      // A superseded commit can leave an older funded batch in the store.
      if (isReusable(fromStoreAfterEncode)) {
        const matching = withFundedBatchCalldata(fromStoreAfterEncode);
        if (matching) {
          return finalizePreparedWithdraw(matching);
        }
      }

      console.error(
        'Money Account withdraw: amount encode did not produce a funded batch, refusing to approve placeholder',
        {
          transactionId: transactionMeta.id,
          amountHuman,
          encodeCommitted: rawUpdate !== false,
          encodeFunded: Boolean(update),
          hasStoreTransaction: Boolean(fromStore),
          hasStoreNestedCalls: Boolean(
            fromStore?.nestedTransactions?.[0] &&
            fromStore?.nestedTransactions[1],
          ),
          hasConfirmationNestedCalls: Boolean(
            transactionMeta.nestedTransactions?.[0] &&
            transactionMeta.nestedTransactions[1],
          ),
        },
      );
      return null;
    },
    [dispatch, recipient],
  );

  return { prepareWithdrawTransaction };
}
