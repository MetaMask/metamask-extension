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
import type { WithdrawAmountCommitResult } from '../../../../../shared/lib/money/withdraw-amount-commit';
import {
  findTransaction,
  getAccountByAddress,
  getMoneyPayContext,
  getSelectedAccount,
  resetTransactionEstimates,
  runSingleFlightAmountUpdate,
  type AmountUpdateIntent,
  type MoneyPayMessenger,
} from './pay-context';

const UPDATE_ERROR_PREFIX = 'Update Amount: Money Account Withdrawal: ';

const amountUpdates = new Map<
  string,
  AmountUpdateIntent<WithdrawAmountCommitResult>
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
  if (
    transaction.nestedTransactions?.[0]?.type !==
      TransactionType.moneyAccountWithdraw ||
    transaction.nestedTransactions[1]?.type !==
      TransactionType.tokenMethodTransfer
  ) {
    failUpdate('missing withdraw/transfer transaction template');
  }
}

/**
 * Resolves and validates the account the redeemed mUSD is forwarded to: the
 * Pay account override when the user picked a destination on the
 * confirmation, otherwise the globally selected account (mobile's
 * `selectEvmAddress` default). The override is looked up as a wallet account
 * rather than trusted as an address — the UI can only ever direct a
 * withdrawal at an account the wallet holds.
 *
 * @param messenger - The messenger to resolve the account through.
 * @param accountOverride - The Pay account override for the transaction.
 * @returns The validated recipient address.
 */
function resolveRecipient(
  messenger: MoneyPayMessenger,
  accountOverride: Hex | undefined,
): Hex {
  const account = accountOverride
    ? getAccountByAddress(messenger, accountOverride)
    : getSelectedAccount(messenger);
  if (!account) {
    failUpdate('missing recipient account');
  }
  if (!isEvmAccountType(account.type)) {
    failUpdate('recipient is not an EVM account');
  }
  const recipient = account.address;
  if (!isStrictHexString(recipient)) {
    failUpdate('invalid recipient address');
  }
  return recipient;
}

async function updateMoneyAccountWithdrawAmountInternal(
  messenger: MoneyPayMessenger,
  transaction: TransactionMeta,
  amountHuman: string,
  recipient: Hex,
  isCurrentIntent: () => boolean,
): Promise<WithdrawAmountCommitResult> {
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
    return { didCommit: false };
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
    return { didCommit: false };
  }

  const withdrawData = withdrawTx.params.data;
  const transferData = transferTx.params.data;
  if (!withdrawData || !transferData) {
    failUpdate('incomplete withdraw/transfer updates');
  }

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

      const { nestedTransactions, transactionData } = updateEIP7702BatchData({
        from: transactionMeta.txParams.from as Hex,
        transactions: transactionMeta.nestedTransactions ?? [],
        updates: [
          { transactionIndex: 0, transactionData: withdrawData },
          { transactionIndex: 1, transactionData: transferData },
        ],
      });

      transactionMeta.nestedTransactions = nestedTransactions;
      transactionMeta.txParams.data = transactionData;
      resetTransactionEstimates(transactionMeta);
    },
  });

  return { didCommit: true, recipient };
}

/**
 * Prepares and atomically commits a Money Account withdrawal amount:
 * re-encodes the withdraw + transfer calldata for the new amount (which needs
 * the vault rate for the share conversion) and writes it into the transaction
 * in one `updateTransactionMetadata` call.
 *
 * The concurrency contract mirrors `updateMoneyAccountDepositAmount`:
 * identical in-flight intents share a promise, and a newer intent for the
 * same transaction prevents an older preparation from committing stale
 * calldata — the superseded call resolves `{ didCommit: false }`. The
 * recipient is part of the intent identity: the same amount aimed at a
 * different recipient is a different intent, and the committed recipient is
 * returned so the UI's Confirm gate can compare it against the one displayed.
 *
 * @param messenger - The messenger to resolve and commit through.
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @param amountHuman - Exact human-readable amount.
 * @param accountOverride - The Pay account override for the transaction; the
 * recipient falls back to the selected account when unset.
 * @returns Whether this intent committed transaction metadata, and the
 * recipient it encoded if so.
 */
export function updateMoneyAccountWithdrawAmount(
  messenger: MoneyPayMessenger,
  transactionId: string,
  amountHuman: string,
  accountOverride?: Hex,
): Promise<WithdrawAmountCommitResult> {
  const transaction = findTransaction(
    messenger,
    ({ id }) => id === transactionId,
  );
  if (!transaction) {
    failUpdate('transaction not found');
  }

  const recipient = resolveRecipient(messenger, accountOverride);

  const intentKey = JSON.stringify({ amountHuman, recipient, transactionId });

  return runSingleFlightAmountUpdate(
    amountUpdates,
    transactionId,
    intentKey,
    (isCurrentIntent) =>
      updateMoneyAccountWithdrawAmountInternal(
        messenger,
        transaction,
        amountHuman,
        recipient,
        isCurrentIntent,
      ),
  );
}
