import type { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import type {
  GetAmountDataResponse,
  GetAmountDataRequest,
} from '@metamask/transaction-pay-controller';
import { buildMoneyAccountDepositBatch } from '@metamask/money-account-utils';
import {
  getMoneyAccountFlow,
  MoneyAccountFlow,
} from '../../../../../shared/lib/money/money-account-flow';
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

  const amountRaw = parseMusdAmount(amount);
  if (amountRaw === undefined) {
    return { updates: [] };
  }

  return { updates: await encodeDepositCalldata(messenger, amountRaw) };
}

function parseMusdAmount(amount: string): bigint | undefined {
  try {
    const parsed = BigInt(amount);
    return parsed > 0n ? parsed : undefined;
  } catch {
    return undefined;
  }
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
