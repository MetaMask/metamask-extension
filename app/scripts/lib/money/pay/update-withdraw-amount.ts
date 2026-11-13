import { buildMoneyAccountWithdrawBatch } from '@metamask/money-account-utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { isStrictHexString, type Hex } from '@metamask/utils';
import {
  getMoneyAccountFlow,
  MoneyAccountFlow,
} from '../../../../../shared/lib/money/money-account-flow';
import {
  getMoneyAccountWithdrawTransferTarget,
  type MoneyAccountWithdrawAmountUpdate,
} from '../../../../../shared/lib/money/withdraw-amount-commit';
import { parseStandardTokenTransactionData } from '../../../../../shared/lib/transaction.utils';
import {
  beginAmountCommit,
  clearAmountCommitIfCurrent,
  commitTransactionPayUpdates,
  getPendingAmountCommit,
  getTransactionMeta,
  parseMusdHumanAmount,
  pruneStaleAmountCommits,
} from './amount-commit';
import { getMoneyPayContext, type MoneyPayMessenger } from './pay-context';

export type { MoneyAccountWithdrawAmountUpdate };

/**
 * The Pay receive token selected for a withdrawal.
 */
export type WithdrawPaymentToken = {
  address: Hex;
  chainId: Hex;
};

const LOG_TAG = '[Money Account]';

/**
 * Re-encodes the nested withdraw + transfer calls for a new human amount and
 * writes them onto the transaction. The recipient is the address that receives
 * the redeemed mUSD (typically the Pay account override or, when unset, the
 * currently selected EVM account). Superseded intents resolve `false`.
 *
 * A quoted withdrawal is bridged by the money account, so the transfer keeps
 * the mUSD on the money account and Pay sends the output to the recipient.
 *
 * Confirm patches the returned hexes onto the approval clone because the UI
 * bridge can strip nested calldata from the store copy.
 *
 * @param messenger - Messenger used to encode and commit.
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @param amountHuman - Exact human-readable mUSD amount.
 * @param recipientOverride - Address that receives the redeemed mUSD, if set.
 * @param paymentToken - Selected Pay receive token, if any.
 * @returns Encoded nested calldata, or `false` when this intent did not commit.
 */
export async function updateMoneyAccountWithdrawAmount(
  messenger: MoneyPayMessenger,
  transactionId: string,
  amountHuman: string,
  recipientOverride?: Hex,
  paymentToken?: WithdrawPaymentToken,
): Promise<MoneyAccountWithdrawAmountUpdate | false> {
  pruneStaleAmountCommits(messenger);

  const amountRaw = parseMusdHumanAmount(amountHuman);
  if (amountRaw === undefined) {
    return false;
  }

  const transaction = getTransactionMeta(messenger, transactionId);
  if (!transaction) {
    return false;
  }

  return await commitWithdrawAmount({
    amountRaw,
    messenger,
    recipientOverride,
    paymentToken,
    transaction,
  });
}

/**
 * Re-encodes an already funded withdrawal when a new receive token or
 * recipient changes the transfer target. Leaves placeholder or unchanged
 * batches alone. An in-flight typed amount wins over the stored one.
 *
 * @param messenger - Messenger used to encode and commit.
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @param recipientOverride - Address that receives the redeemed mUSD, if set.
 * @param paymentToken - Selected Pay receive token, if any.
 * @returns Whether the transfer was re-encoded.
 */
export async function syncMoneyAccountWithdrawTransfer(
  messenger: MoneyPayMessenger,
  transactionId: string,
  recipientOverride?: Hex,
  paymentToken?: WithdrawPaymentToken,
): Promise<boolean> {
  const transaction = getTransactionMeta(messenger, transactionId);
  if (getMoneyAccountFlow(transaction) !== MoneyAccountFlow.Withdraw) {
    return false;
  }

  const transfer = getTransfer(transaction);
  // A pending commit may still write the previous target, so replace it.
  const pending = getPendingAmountCommit(transactionId);
  const amountRaw = pending?.amountRaw ?? transfer?.amountRaw;
  const context = getMoneyPayContext(messenger);

  if (!transaction || amountRaw === undefined || !context) {
    return false;
  }

  const recipient = resolveWithdrawRecipient(messenger, recipientOverride);
  const target = getMoneyAccountWithdrawTransferTarget({
    moneyAccountAddress: context.moneyAccountAddress,
    recipient,
    paymentToken,
    transaction,
  });

  if (!pending && transfer?.to.toLowerCase() === target.toLowerCase()) {
    return false;
  }

  const result = await commitWithdrawAmount({
    amountRaw,
    messenger,
    recipientOverride,
    paymentToken,
    transaction,
  });

  return result !== false;
}

async function commitWithdrawAmount({
  amountRaw,
  messenger,
  recipientOverride,
  paymentToken,
  transaction,
}: {
  amountRaw: bigint;
  messenger: MoneyPayMessenger;
  recipientOverride?: Hex;
  paymentToken?: WithdrawPaymentToken;
  transaction: TransactionMeta;
}): Promise<MoneyAccountWithdrawAmountUpdate | false> {
  const { id: transactionId } = transaction;
  const isCurrent = beginAmountCommit(transactionId, amountRaw);

  try {
    const recipient = resolveWithdrawRecipient(messenger, recipientOverride);
    const updates = await encodeWithdrawCalldata({
      amount: amountRaw,
      messenger,
      recipient,
      paymentToken,
      transaction,
    });

    if (!isCurrent()) {
      return false;
    }

    commitTransactionPayUpdates(messenger, transactionId, updates);

    const committed = getTransactionMeta(messenger, transactionId);
    const transactionData = committed?.txParams?.data as Hex | undefined;
    return {
      withdrawData: updates[0].data,
      transferData: updates[1].data,
      ...(transactionData ? { transactionData } : {}),
    };
  } catch (error) {
    if (!isCurrent()) {
      return false;
    }
    throw error;
  } finally {
    clearAmountCommitIfCurrent(transactionId, isCurrent);
  }
}

/**
 * Resolves who receives the redeemed mUSD: the explicit recipient override,
 * otherwise the currently selected EVM account.
 *
 * @param messenger - Messenger used to read the selected account.
 * @param recipientOverride - Address that receives the redeemed mUSD, if set.
 * @returns The recipient address.
 */
function resolveWithdrawRecipient(
  messenger: MoneyPayMessenger,
  recipientOverride?: Hex,
): Hex {
  if (recipientOverride && isStrictHexString(recipientOverride)) {
    return recipientOverride;
  }

  const selectedAddress = messenger.call(
    'AccountsController:getSelectedAccount',
  )?.address;
  if (!isStrictHexString(selectedAddress)) {
    throw new Error(`${LOG_TAG} Withdrawal recipient is not available`);
  }

  return selectedAddress;
}

/**
 * Decodes the funded nested mUSD transfer of a withdrawal batch.
 *
 * @param transaction - The withdrawal transaction.
 * @returns The transfer target and raw amount, or `undefined` when unfunded.
 */
function getTransfer(
  transaction: TransactionMeta | undefined,
): { to: Hex; amountRaw: bigint } | undefined {
  const data = transaction?.nestedTransactions?.[1]?.data;
  const parsed = data ? parseStandardTokenTransactionData(data) : undefined;

  if (parsed?.name !== 'transfer') {
    return undefined;
  }

  const to = parsed.args._to ?? parsed.args.to;
  const value = parsed.args._value ?? parsed.args.value;

  if (!isStrictHexString(to) || value === undefined) {
    return undefined;
  }

  const amountRaw = BigInt(value.toString());
  return amountRaw === 0n ? undefined : { to, amountRaw };
}

/**
 * Encodes the withdraw + transfer pair for a raw mUSD amount.
 *
 * @param options - Options bag.
 * @param options.amount - Withdrawal amount in mUSD base units.
 * @param options.messenger - Messenger used to resolve vault context.
 * @param options.recipient - Account that receives the withdrawal.
 * @param options.paymentToken - Selected Pay receive token, if any.
 * @param options.transaction - The withdrawal transaction.
 * @returns Nested calldata updates for the withdraw and transfer calls.
 */
async function encodeWithdrawCalldata({
  amount,
  messenger,
  recipient,
  paymentToken,
  transaction,
}: {
  amount: bigint;
  messenger: MoneyPayMessenger;
  recipient: Hex;
  paymentToken?: WithdrawPaymentToken;
  transaction: TransactionMeta;
}): Promise<
  {
    nestedTransactionIndex: number;
    data: Hex;
  }[]
> {
  const context = getMoneyPayContext(messenger);
  if (!context) {
    throw new Error(`${LOG_TAG} Money account withdrawal is not available`);
  }

  const { moneyAccountAddress, vaultConfig, provider } = context;
  const { withdrawTx, transferTx } = await buildMoneyAccountWithdrawBatch({
    amount,
    chainId: vaultConfig.chainId,
    tellerAddress: vaultConfig.tellerAddress,
    accountantAddress: vaultConfig.accountantAddress,
    moneyAccountAddress,
    recipient: getMoneyAccountWithdrawTransferTarget({
      moneyAccountAddress,
      recipient,
      paymentToken,
      transaction,
    }),
    provider,
  });

  return [
    { nestedTransactionIndex: 0, data: withdrawTx.params.data },
    { nestedTransactionIndex: 1, data: transferTx.params.data },
  ];
}
