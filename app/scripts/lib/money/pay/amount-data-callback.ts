import { buildMoneyAccountDepositBatch } from '@metamask/money-account-utils';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type {
  GetAmountDataRequest,
  GetAmountDataResponse,
} from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import {
  getMoneyPayContext,
  prefixError,
  type MoneyPayMessenger,
} from './pay-context';

const UPDATE_AMOUNT_DATA_ERROR_PREFIX = 'Update Amount Data: ';
const MONEY_ACCOUNT_DEPOSIT_ERROR_PREFIX = 'Money Account Deposit: ';

/**
 * Whether a transaction is a Money Account deposit, checking the parent type
 * and the nested transactions — the deposit call is nested inside a batch, so
 * the parent alone is not enough.
 *
 * @param transaction - The transaction to check.
 * @returns Whether the transaction is a Money Account deposit.
 */
function isMoneyAccountDeposit(transaction: TransactionMeta): boolean {
  if (transaction.type === TransactionType.moneyAccountDeposit) {
    return true;
  }
  return (
    transaction.nestedTransactions?.some(
      (tx) => tx.type === TransactionType.moneyAccountDeposit,
    ) ?? false
  );
}

/**
 * `GetAmountDataCallback` for Money Account deposits: re-encodes the nested
 * approve + deposit calldata for the amount Pay has settled on.
 *
 * The amount arrives already in mUSD base units (Pay resolves decimals before
 * calling), so no rounding happens here — the rounding decisions live at the
 * sites that convert human amounts (deposits round up, the withdraw override
 * rounds down; see `payment-override-callback.ts`).
 *
 * Every guard returns `{ updates: [] }` rather than throwing: Pay calls this
 * for every transaction it processes, and "not a money deposit" or "money not
 * available yet" are normal states. A zero amount also no-ops — Pay pushes
 * every amount change including a cleared field, and the builder throws on
 * zero rather than encoding a deposit that mints nothing.
 *
 * @param request - The amount and the transaction whose nested calls to update.
 * @param messenger - The messenger to resolve the Money Pay context through.
 * @returns The per-nested-call data updates.
 */
export async function getMoneyAccountAmountData(
  request: GetAmountDataRequest,
  messenger: MoneyPayMessenger,
): Promise<GetAmountDataResponse> {
  const { amount, transaction } = request;

  if (!isMoneyAccountDeposit(transaction)) {
    return { updates: [] };
  }

  const context = getMoneyPayContext(messenger, transaction.chainId as Hex);
  if (!context) {
    return { updates: [] };
  }

  const rawAmount = BigInt(amount);
  if (rawAmount === 0n) {
    return { updates: [] };
  }

  const { vaultConfig, provider } = context;

  try {
    let buildResult;

    try {
      buildResult = await buildMoneyAccountDepositBatch({
        amount: rawAmount,
        chainId: transaction.chainId as Hex,
        boringVault: vaultConfig.boringVault,
        tellerAddress: vaultConfig.tellerAddress,
        accountantAddress: vaultConfig.accountantAddress,
        lensAddress: vaultConfig.lensAddress,
        provider,
      });
    } catch (error) {
      throw prefixError(error, MONEY_ACCOUNT_DEPOSIT_ERROR_PREFIX);
    }

    const approveData = buildResult.approveTx.params.data;
    const depositData = buildResult.depositTx.params.data;
    if (!approveData || !depositData) {
      throw new Error('Missing calldata in deposit batch result');
    }

    return {
      updates: [
        { nestedTransactionIndex: 0, data: approveData },
        { nestedTransactionIndex: 1, data: depositData },
      ],
    };
  } catch (error) {
    throw prefixError(error, UPDATE_AMOUNT_DATA_ERROR_PREFIX);
  }
}
