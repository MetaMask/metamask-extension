import { buildMoneyAccountDepositBatch } from '@metamask/money-account-utils';
import type {
  GetAmountDataRequest,
  GetAmountDataResponse,
} from '@metamask/transaction-pay-controller';
import {
  getMoneyAccountFlow,
  MoneyAccountFlow,
} from '../../../../../shared/lib/money/money-account-flow';
import {
  commitTransactionPayUpdates,
  getTransactionMeta,
  parseMusdHumanAmount,
  pruneStaleAmountCommits,
  toMusdAmountHex,
  withAmountCommitIntent,
} from '../../confirmations/utils/pay-amount-commit';
import { getMoneyPayContext, type MoneyPayMessenger } from './pay-context';

const LOG_TAG = '[Money Account]';

/**
 * Re-encodes nested approve + deposit calldata for a raw mUSD amount.
 * Used both when the user types an amount and when Pay re-encodes the vault
 * calls after Relay settles (`getAmountData`).
 *
 * @param messenger - Messenger used to resolve vault context.
 * @param request - Raw amount and the transaction whose nested calls to encode.
 * @param request.amount - Deposit amount in mUSD base units (decimal string).
 * @param request.transaction - Transaction whose nested vault calls are re-encoded.
 * @returns Nested calldata updates, or empty when this is not a deposit.
 */
export async function getMoneyAccountAmountData(
  messenger: MoneyPayMessenger,
  { amount, transaction }: GetAmountDataRequest,
): Promise<GetAmountDataResponse> {
  if (getMoneyAccountFlow(transaction) !== MoneyAccountFlow.Deposit) {
    return { updates: [] };
  }

  let amountRaw: bigint;
  try {
    amountRaw = BigInt(amount);
  } catch {
    return { updates: [] };
  }

  if (amountRaw <= 0n) {
    return { updates: [] };
  }

  return { updates: await encodeDepositCalldata(messenger, amountRaw) };
}

export async function updateMoneyAccountDepositAmount(
  messenger: MoneyPayMessenger,
  transactionId: string,
  amountHuman: string,
): Promise<boolean> {
  pruneStaleAmountCommits(messenger);

  const amountRaw = parseMusdHumanAmount(amountHuman);
  if (amountRaw === undefined) {
    return false;
  }

  const transaction = getTransactionMeta(messenger, transactionId);
  if (!transaction) {
    return false;
  }

  return withAmountCommitIntent<boolean>(
    messenger,
    transactionId,
    async (isCurrent) => {
      const { updates } = await getMoneyAccountAmountData(messenger, {
        amount: amountRaw.toString(10),
        transaction,
      });

      if (!isCurrent() || !updates.length) {
        return false;
      }

      return commitTransactionPayUpdates(
        messenger,
        transactionId,
        updates,
        'Money Account deposit: update amount',
        toMusdAmountHex(amountRaw),
      );
    },
  );
}

/**
 * Encodes the approve + deposit pair for a raw mUSD amount.
 *
 * @param messenger - Messenger used to resolve vault context.
 * @param amount - Deposit amount in mUSD base units.
 * @returns Nested calldata updates for the approve and deposit calls.
 */
async function encodeDepositCalldata(
  messenger: MoneyPayMessenger,
  amount: bigint,
): Promise<GetAmountDataResponse['updates']> {
  const context = getMoneyPayContext(messenger);
  if (!context) {
    throw new Error(`${LOG_TAG} Money account deposit is not available`);
  }

  const { vaultConfig, provider } = context;
  const { approveTx, depositTx } = await buildMoneyAccountDepositBatch({
    amount,
    chainId: vaultConfig.chainId,
    boringVault: vaultConfig.boringVault,
    tellerAddress: vaultConfig.tellerAddress,
    accountantAddress: vaultConfig.accountantAddress,
    lensAddress: vaultConfig.lensAddress,
    provider,
  });

  return [
    { nestedTransactionIndex: 0, data: approveTx.params.data },
    { nestedTransactionIndex: 1, data: depositTx.params.data },
  ];
}
