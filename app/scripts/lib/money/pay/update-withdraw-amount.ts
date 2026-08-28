import { buildMoneyAccountWithdrawBatch } from '@metamask/money-account-utils';
import { isStrictHexString, type Hex } from '@metamask/utils';
import type { WithdrawAmountCommitResult } from '../../../../../shared/lib/money/withdraw-amount-commit';
import {
  applyNestedCalldataUpdates,
  beginAmountCommit,
  getTransactionMeta,
  parseMusdHumanAmount,
} from './amount-commit';
import { getMoneyPayContext, type MoneyPayMessenger } from './pay-context';

const LOG_TAG = '[Money Account]';

/**
 * Re-encodes the nested withdraw + transfer calls for a new human amount and
 * writes them onto the transaction. The recipient is the Pay account override
 * (the account shown on the confirmation) or, when unset, the currently
 * selected EVM account. Superseded intents resolve `{ didCommit: false }`.
 *
 * @param messenger - Messenger used to encode and commit.
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @param amountHuman - Exact human-readable mUSD amount.
 * @param accountOverride - Pay funding/destination account, if set.
 * @returns Whether this intent committed, and the recipient it encoded if so.
 */
export async function updateMoneyAccountWithdrawAmount(
  messenger: MoneyPayMessenger,
  transactionId: string,
  amountHuman: string,
  accountOverride?: Hex,
): Promise<WithdrawAmountCommitResult> {
  const amountRaw = parseMusdHumanAmount(amountHuman);
  if (amountRaw === undefined) {
    return { didCommit: false };
  }

  const transaction = getTransactionMeta(messenger, transactionId);
  if (!transaction) {
    return { didCommit: false };
  }

  const isCurrent = beginAmountCommit(transactionId);

  try {
    const recipient = resolveWithdrawRecipient(messenger, accountOverride);
    const updates = await encodeWithdrawCalldata(
      messenger,
      amountRaw,
      recipient,
    );

    if (!isCurrent()) {
      return { didCommit: false };
    }

    applyNestedCalldataUpdates(
      messenger,
      transactionId,
      updates,
      'Money Account withdraw: update amount',
    );
    return { didCommit: true, recipient };
  } catch (error) {
    if (!isCurrent()) {
      return { didCommit: false };
    }
    throw error;
  }
}

/**
 * Resolves who receives the redeemed mUSD: Pay's account override, otherwise
 * the currently selected EVM account.
 *
 * @param messenger - Messenger used to read the selected account.
 * @param accountOverride - Pay destination account, if set.
 * @returns The recipient address.
 */
function resolveWithdrawRecipient(
  messenger: MoneyPayMessenger,
  accountOverride?: Hex,
): Hex {
  if (accountOverride && isStrictHexString(accountOverride)) {
    return accountOverride;
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
