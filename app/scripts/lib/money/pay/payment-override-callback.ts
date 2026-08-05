import {
  buildMoneyAccountDepositBatch,
  buildMoneyAccountWithdrawBatch,
  MUSD_DECIMALS,
} from '@metamask/money-account-utils';
import {
  TransactionStatus,
  type AuthorizationList,
  type BatchTransactionParams,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  PaymentOverride,
  type GetPaymentOverrideDataRequest,
  type GetPaymentOverrideDataResponse,
} from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { calcTokenValue } from '../../../../../shared/lib/swaps-utils';
import {
  getDelegationTransaction,
  type DelegationMessenger,
} from '../../transaction/delegation';
import {
  getMoneyPayContext,
  type MoneyPayContext,
  type MoneyPayMessenger,
} from './pay-context';

/**
 * Converts a human-readable mUSD amount to base units with an explicit
 * rounding direction.
 *
 * Deliberately **not** shared with any other conversion site: the rounding
 * direction differs per flow on purpose (deposits round up so the user is
 * never shorted; the withdraw override rounds down so Max never requests more
 * than the withdrawable balance), and a helper that unifies them is how the
 * directions get silently swapped.
 *
 * Uses bignumber 4's `.round(0, mode)` — in this version `decimalPlaces(0,
 * mode)` is a getter that ignores its arguments and returns a count, so
 * porting mobile's call verbatim would encode a garbage amount.
 *
 * @param amountHuman - The human-readable amount.
 * @param roundingMode - The bignumber rounding mode.
 * @returns The amount in mUSD base units.
 */
function toMusdBaseUnits(amountHuman: string, roundingMode: number): bigint {
  return BigInt(
    calcTokenValue(amountHuman, MUSD_DECIMALS)
      .round(0, roundingMode)
      .toFixed(0),
  );
}

/**
 * Builds the synthetic transaction the atomic branch wraps in a delegation:
 * the raw vault calls, nested under a transaction executing from the money
 * account. Only `getDelegationTransaction` ever sees it, so it carries just
 * the fields that function reads.
 *
 * @param options - Options bag.
 * @param options.idPrefix - Prefix for the synthetic transaction id.
 * @param options.context - The resolved Money Pay context.
 * @param options.calls - The raw vault calls to nest.
 * @returns The synthetic transaction meta.
 */
function buildDelegationWrapMeta({
  idPrefix,
  context,
  calls,
}: {
  idPrefix: string;
  context: MoneyPayContext;
  calls: BatchTransactionParams[];
}): TransactionMeta {
  return {
    id: `${idPrefix}-${Date.now()}`,
    chainId: context.vaultConfig.chainId,
    networkClientId: context.networkClientId,
    status: TransactionStatus.unapproved,
    time: Date.now(),
    txParams: {
      from: context.moneyAccountAddress,
    },
    nestedTransactions: calls,
  } as TransactionMeta;
}

/**
 * Builds the withdraw + transfer calls for the Money Account payment override.
 *
 * @param messenger - The messenger to build through.
 * @param recipient - The user's EVM account that receives the mUSD transfer.
 * @param amountHuman - The human-readable amount of mUSD to withdraw.
 * @param atomic - Whether the calls execute atomically with the Relay quote.
 * @returns The calls, or `[]` when the money account is unavailable or the
 * amount is zero.
 */
async function getMoneyAccountWithdrawPaymentOverrideData(
  messenger: MoneyPayMessenger,
  recipient: Hex,
  amountHuman: string,
  atomic: boolean,
): Promise<BatchTransactionParams[]> {
  const context = getMoneyPayContext(messenger);
  if (!context) {
    return [];
  }

  // ROUND_DOWN so Max / near-Max never requests more atomic units than the
  // withdrawable money-account balance (ROUND_UP was pushing past balance).
  const amount = toMusdBaseUnits(amountHuman, BigNumber.ROUND_DOWN);
  if (amount === 0n) {
    return [];
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

  const rawCalls: BatchTransactionParams[] = [
    {
      to: withdrawTx.params.to,
      data: withdrawTx.params.data,
      value: withdrawTx.params.value,
    },
    {
      to: transferTx.params.to,
      data: transferTx.params.data,
      value: transferTx.params.value,
    },
  ];

  // Non-atomic flows submit the raw calls directly as a sponsored batch after
  // Relay completion; the Money Account is already 7702-delegated so no fresh
  // delegation wrap is needed.
  if (!atomic) {
    return rawCalls;
  }

  const delegation = await getDelegationTransaction(
    { messenger: messenger as DelegationMessenger },
    buildDelegationWrapMeta({
      idPrefix: 'money-account-withdraw',
      context,
      calls: rawCalls,
    }),
  );

  return [
    {
      to: delegation.to,
      data: delegation.data,
      value: delegation.value,
    },
  ];
}

/**
 * Builds the approve + deposit calls for the Money Account payment override.
 *
 * @param messenger - The messenger to build through.
 * @param amountHuman - The human-readable amount of mUSD to deposit.
 * @param atomic - Whether the calls execute atomically with the Relay quote.
 * @returns The calls with the money account as recipient, or `{ calls: [] }`
 * when the money account is unavailable or the amount is zero.
 */
async function getMoneyAccountDepositPaymentOverrideData(
  messenger: MoneyPayMessenger,
  amountHuman: string,
  atomic: boolean,
): Promise<{
  calls: BatchTransactionParams[];
  recipient?: Hex;
  authorizationList?: AuthorizationList;
}> {
  const context = getMoneyPayContext(messenger);
  if (!context) {
    return { calls: [] };
  }

  // ROUND_UP: never short the user on a deposit.
  const amount = toMusdBaseUnits(amountHuman, BigNumber.ROUND_UP);
  if (amount === 0n) {
    return { calls: [] };
  }

  const { moneyAccountAddress, vaultConfig, provider } = context;

  const { approveTx, depositTx } = await buildMoneyAccountDepositBatch({
    amount,
    chainId: vaultConfig.chainId,
    boringVault: vaultConfig.boringVault,
    tellerAddress: vaultConfig.tellerAddress,
    accountantAddress: vaultConfig.accountantAddress,
    lensAddress: vaultConfig.lensAddress,
    provider,
  });

  const rawCalls: BatchTransactionParams[] = [
    {
      to: approveTx.params.to,
      data: approveTx.params.data,
      value: approveTx.params.value,
    },
    {
      to: depositTx.params.to,
      data: depositTx.params.data,
      value: depositTx.params.value,
    },
  ];

  // Non-atomic flows submit the raw calls directly as a sponsored batch after
  // Relay completion; the Money Account is already 7702-delegated so no fresh
  // delegation wrap is needed.
  if (!atomic) {
    return { calls: rawCalls, recipient: moneyAccountAddress };
  }

  const delegation = await getDelegationTransaction(
    { messenger: messenger as DelegationMessenger },
    buildDelegationWrapMeta({
      idPrefix: 'money-account-deposit',
      context,
      calls: rawCalls,
    }),
  );

  return {
    recipient: moneyAccountAddress,
    authorizationList: delegation.authorizationList,
    calls: [
      {
        to: delegation.to,
        data: delegation.data,
        value: delegation.value,
      },
    ],
  };
}

/**
 * `GetPaymentOverrideDataCallback` for the Money Account.
 *
 * The discriminator is Pay state, not the transaction type:
 * `paymentOverride === PaymentOverride.MoneyAccount` selects the money flows,
 * and `isPostQuote` separates deposits (funds arrive at the money account
 * after the quote settles) from withdrawals (the money account funds the
 * quote). `atomic` defaults to true; flows whose second leg runs after Relay
 * completion set it to false explicitly.
 *
 * Anything else returns `{ calls: [] }` — this callback is invoked for every
 * payment-override transaction, so "not a money transaction" is the common
 * case, not an error.
 *
 * @param request - The Pay request: amount, transaction, and Pay state.
 * @param messenger - The messenger to build through.
 * @returns The calls to prepend to the submit batch.
 */
export async function getMoneyAccountPaymentOverrideData(
  request: GetPaymentOverrideDataRequest,
  messenger: MoneyPayMessenger,
): Promise<GetPaymentOverrideDataResponse> {
  const { amount, transaction, transactionData } = request;

  if (transactionData?.paymentOverride === PaymentOverride.MoneyAccount) {
    const atomic = transactionData.atomic !== false;

    if (transactionData?.isPostQuote) {
      return await getMoneyAccountDepositPaymentOverrideData(
        messenger,
        amount,
        atomic,
      );
    }

    if (!transaction.txParams?.from) {
      return { calls: [] };
    }

    const calls = await getMoneyAccountWithdrawPaymentOverrideData(
      messenger,
      transaction.txParams.from as Hex,
      amount,
      atomic,
    );
    return { calls };
  }

  return { calls: [] };
}
