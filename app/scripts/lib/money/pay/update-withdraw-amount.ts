import { isEvmAccountType } from '@metamask/keyring-api';
import {
  buildMoneyAccountWithdrawBatch,
  MUSD_DECIMALS,
} from '@metamask/money-account-utils';
import {
  TransactionStatus,
  TransactionType,
  updateEIP7702BatchData,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { isStrictHexString, type Hex } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { calcTokenValue } from '../../../../../shared/lib/swaps-utils';
import {
  findTransaction,
  getMoneyPayContext,
  getSelectedAccount,
  resetTransactionEstimates,
  runSingleFlightAmountUpdate,
  type AmountUpdateIntent,
  type MoneyPayMessenger,
} from './pay-context';

const UPDATE_ERROR_PREFIX = 'Update Amount: Money Account Withdrawal: ';

export type MoneyAccountWithdrawAmountUpdate = {
  transactionData?: Hex;
  transferData: Hex;
  withdrawData: Hex;
};

const amountUpdates = new Map<
  string,
  AmountUpdateIntent<MoneyAccountWithdrawAmountUpdate | false>
>();

function failUpdate(message: string): never {
  throw new Error(`${UPDATE_ERROR_PREFIX}${message}`);
}

/**
 * Asserts the transaction still matches the withdrawal template this updater
 * re-encodes: teller withdraw at index 0, ERC-20 transfer at index 1.
 *
 * @param transaction - The transaction to validate.
 */
function validateTransactionTemplate(transaction: TransactionMeta): void {
  // Require the two nested slots only. `addTransactionBatch` can drop nested
  // types on the unapproved parent, and a type check here made every encode
  // throw — Send then no-op'd because confirm swallowed that error.
  if (
    !transaction.nestedTransactions?.[0] ||
    !transaction.nestedTransactions[1]
  ) {
    failUpdate('missing withdraw/transfer transaction template');
  }
}

async function updateMoneyAccountWithdrawAmountInternal(
  messenger: MoneyPayMessenger,
  transaction: TransactionMeta,
  amountHuman: string,
  isCurrentIntent: () => boolean,
  recipientOverride?: Hex,
): Promise<MoneyAccountWithdrawAmountUpdate | false> {
  validateTransactionTemplate(transaction);

  const chainId = transaction.chainId as Hex;

  const context = getMoneyPayContext(messenger, chainId);
  if (!context) {
    failUpdate('missing vault config or provider');
  }
  const { moneyAccountAddress, vaultConfig, provider } = context;

  // ROUND_DOWN, matching the payment-override withdraw path
  // (`payment-override-callback.ts`) that actually executes the withdrawal.
  // This commit only re-encodes the confirmation's preview calldata; rounding
  // up here would show/commit an amount the payment-override path can't
  // (and won't) submit, since it always rounds down to avoid requesting more
  // atomic units than the withdrawable balance.
  const amountRaw = calcTokenValue(amountHuman, MUSD_DECIMALS)
    .round(0, BigNumber.ROUND_DOWN)
    .toFixed(0);

  // A cleared amount field arrives as zero; the builder throws on zero rather
  // than encoding a redemption of no shares.
  if (BigInt(amountRaw) === 0n) {
    return false;
  }

  // Mobile: `recipientOverride ?? selectEvmAddress`. The From-row override is
  // the user's EVM account; `txParams.from` is the money account and must not
  // receive the redeemed mUSD. Fall back to the selected account when no
  // override is set, resolved at commit time.
  //
  // The fallback is validated rather than cast: the selected account is
  // global state the user can change mid-flow, including to a non-EVM
  // account whose address would otherwise reach the ABI encoder as a bogus
  // recipient.
  let recipient: string | undefined = recipientOverride;
  if (!recipient) {
    const selectedAccount = getSelectedAccount(messenger);
    if (!selectedAccount) {
      failUpdate('missing recipient account');
    }
    if (!isEvmAccountType(selectedAccount.type)) {
      failUpdate('selected account is not an EVM account');
    }
    recipient = selectedAccount.address;
  }
  if (!isStrictHexString(recipient)) {
    failUpdate('invalid recipient address');
  }

  const { withdrawTx, transferTx } = await buildMoneyAccountWithdrawBatch({
    amount: BigInt(amountRaw),
    chainId,
    tellerAddress: vaultConfig.tellerAddress,
    accountantAddress: vaultConfig.accountantAddress,
    moneyAccountAddress,
    recipient,
    provider,
  });

  if (!isCurrentIntent()) {
    return false;
  }

  const withdrawData = withdrawTx.params.data;
  const transferData = transferTx.params.data;
  if (!withdrawData || !transferData) {
    failUpdate('incomplete withdraw/transfer updates');
  }

  let transactionData: Hex | undefined;
  messenger.call('TransactionController:updateTransactionMetadata', {
    transactionId: transaction.id,
    skipResimulate: true,
    callback: (transactionMeta: TransactionMeta) => {
      validateTransactionTemplate(transactionMeta);

      // Checked at commit time, inside the atomic metadata write: the UI
      // gate is the primary defense, but calldata must never be rewritten
      // under a transaction that has already been approved for signing.
      if (transactionMeta.status !== TransactionStatus.unapproved) {
        failUpdate('transaction is no longer unapproved');
      }

      if (transactionMeta.chainId !== chainId) {
        failUpdate('transaction chain changed during preparation');
      }

      const updated = updateEIP7702BatchData({
        from: transactionMeta.txParams.from as Hex,
        transactions: transactionMeta.nestedTransactions ?? [],
        updates: [
          { transactionIndex: 0, transactionData: withdrawData },
          { transactionIndex: 1, transactionData: transferData },
        ],
      });
      transactionData = updated.transactionData;

      transactionMeta.type = TransactionType.moneyAccountWithdraw;
      transactionMeta.nestedTransactions = updated.nestedTransactions;
      transactionMeta.txParams.data = updated.transactionData;
      resetTransactionEstimates(transactionMeta);
    },
  });

  const committed = findTransaction(
    messenger,
    ({ id }) => id === transaction.id,
  );
  if (!committed) {
    failUpdate('transaction missing after commit');
  }

  // Return the hexes, not the full TransactionMeta. The UI background bridge
  // often strips nested calldata, which made Send treat a successful encode
  // as "not funded" and no-op.
  return { withdrawData, transferData, transactionData };
}

/**
 * Prepares and atomically commits a Money Account withdrawal amount:
 * re-encodes the withdraw + transfer calldata and writes both nested calls
 * in one `updateTransactionMetadata` so confirm can approve the returned
 * transaction instead of the empty placeholder.
 *
 * @param messenger - The messenger to resolve and commit through.
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @param amountHuman - Exact human-readable amount.
 * @param recipientOverride - Optional EVM address to receive the redeemed mUSD.
 * When omitted, defaults to the currently selected account.
 * @returns The encoded nested calldata, or `false` if this intent did not
 * commit (zero amount or superseded).
 */
export function updateMoneyAccountWithdrawAmount(
  messenger: MoneyPayMessenger,
  transactionId: string,
  amountHuman: string,
  recipientOverride?: Hex,
): Promise<MoneyAccountWithdrawAmountUpdate | false> {
  const transaction = findTransaction(
    messenger,
    ({ id }) => id === transactionId,
  );
  if (!transaction) {
    failUpdate('transaction not found');
  }

  const intentKey = JSON.stringify({
    amountHuman,
    recipientOverride: recipientOverride?.toLowerCase() ?? null,
    transactionId,
  });

  return runSingleFlightAmountUpdate(
    amountUpdates,
    transactionId,
    intentKey,
    (isCurrentIntent) =>
      updateMoneyAccountWithdrawAmountInternal(
        messenger,
        transaction,
        amountHuman,
        isCurrentIntent,
        recipientOverride,
      ),
  );
}
