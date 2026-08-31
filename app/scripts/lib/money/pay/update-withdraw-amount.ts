import { buildMoneyAccountWithdrawBatch } from '@metamask/money-account-utils';
import { isStrictHexString, type Hex } from '@metamask/utils';
import type { MoneyAccountWithdrawAmountUpdate } from '../../../../../shared/lib/money/withdraw-amount-commit';
import {
  beginAmountCommit,
  clearAmountCommitIfCurrent,
  commitTransactionPayUpdates,
  getTransactionMeta,
  parseMusdHumanAmount,
  pruneStaleAmountCommits,
} from './amount-commit';
import { getMoneyPayContext, type MoneyPayMessenger } from './pay-context';

export type { MoneyAccountWithdrawAmountUpdate };

const LOG_TAG = '[Money Account]';

/**
 * Re-encodes the nested withdraw + transfer calls for a new human amount and
 * writes them onto the transaction. The recipient is the address that receives
 * the redeemed mUSD (typically the Pay account override or, when unset, the
 * currently selected EVM account). Superseded intents resolve `false`.
 *
 * Confirm patches the returned hexes onto the approval clone because the UI
 * bridge can strip nested calldata from the store copy.
 *
 * @param messenger - Messenger used to encode and commit.
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @param amountHuman - Exact human-readable mUSD amount.
 * @param recipientOverride - Address that receives the redeemed mUSD, if set.
 * @returns Encoded nested calldata, or `false` when this intent did not commit.
 */
export async function updateMoneyAccountWithdrawAmount(
  messenger: MoneyPayMessenger,
  transactionId: string,
  amountHuman: string,
  recipientOverride?: Hex,
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

  const isCurrent = beginAmountCommit(transactionId);

  try {
    const recipient = resolveWithdrawRecipient(messenger, recipientOverride);
    const updates = await encodeWithdrawCalldata(
      messenger,
      amountRaw,
      recipient,
    );

    if (!isCurrent()) {
      return false;
    }

    commitTransactionPayUpdates(
      messenger,
      transactionId,
      updates,
      'Money Account withdraw: update amount',
    );

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
 * Encodes the withdraw + transfer pair for a raw mUSD amount.
 *
 * @param messenger - Messenger used to resolve vault context.
 * @param amount - Withdrawal amount in mUSD base units.
 * @param recipient - Address that receives the subsequent mUSD transfer.
 * @returns Nested calldata updates for the withdraw and transfer calls.
 */
async function encodeWithdrawCalldata(
  messenger: MoneyPayMessenger,
  amount: bigint,
  recipient: Hex,
): Promise<
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
    recipient,
    provider,
  });

  return [
    { nestedTransactionIndex: 0, data: withdrawTx.params.data },
    { nestedTransactionIndex: 1, data: transferTx.params.data },
  ];
}
