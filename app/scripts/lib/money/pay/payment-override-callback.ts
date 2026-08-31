import { BigNumber } from 'bignumber.js';
import {
  buildMoneyAccountDepositBatch,
  buildMoneyAccountWithdrawBatch,
  MUSD_DECIMALS,
} from '@metamask/money-account-utils';
import {
  TransactionStatus,
  type BatchTransactionParams,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  PaymentOverride,
  type GetPaymentOverrideDataRequest,
  type GetPaymentOverrideDataResponse,
} from '@metamask/transaction-pay-controller';
import { isStrictHexString, type Hex } from '@metamask/utils';
import {
  getDelegationTransaction,
  type DelegationMessenger,
} from '../../transaction/delegation';
import { getMoneyPayContext, type MoneyPayMessenger } from './pay-context';

const MUSD_UNIT = 10 ** MUSD_DECIMALS;

/**
 * Parses a human-readable mUSD amount into base units, rounding down so Max
 * never requests more atomic units than the withdrawable money-account
 * balance. Returns `undefined` for zero, negative, or non-numeric input.
 *
 * @param amountHuman - Exact human-readable mUSD amount.
 * @returns The amount in mUSD base units, or `undefined` when unusable.
 */
function parseMusdHumanAmountDown(amountHuman: string): bigint | undefined {
  let value: BigNumber;
  try {
    value = new BigNumber(amountHuman);
  } catch {
    return undefined;
  }

  if (!value.isFinite() || value.lte(0)) {
    return undefined;
  }

  const raw = value.times(MUSD_UNIT).round(0, BigNumber.ROUND_DOWN);
  if (raw.lte(0)) {
    return undefined;
  }

  return BigInt(raw.toString(10));
}

function toBatchCall(params: {
  to?: string;
  data?: string;
  value?: string;
}): BatchTransactionParams {
  return {
    to: params.to as Hex,
    data: params.data as Hex | undefined,
    value: params.value as Hex | undefined,
  };
}

/**
 * Builds the Money Account vault-withdraw + mUSD-transfer calls that fund a
 * confirmation (e.g. Perps deposit) from the money account.
 *
 * Atomic flows wrap the pair in a fresh EIP-7702 delegation so Relay can
 * embed it. Non-atomic flows return the raw calls for a sponsored batch after
 * Relay completes — the money account is already delegated.
 *
 * @param messenger - Messenger used to resolve vault context and sign.
 * @param recipient - Address that receives the redeemed mUSD.
 * @param amountHuman - Human-readable mUSD amount.
 * @param atomic - Whether to wrap the calls in an EIP-7702 delegation.
 * @returns Batch calls to prepend, or an empty list when unavailable.
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

  const amount = parseMusdHumanAmountDown(amountHuman);
  if (amount === undefined) {
    return [];
  }

  const { moneyAccountAddress, vaultConfig, networkClientId, provider } =
    context;
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
    toBatchCall(withdrawTx.params),
    toBatchCall(transferTx.params),
  ];

  if (!atomic) {
    return rawCalls;
  }

  const transactionMeta = {
    id: `money-account-withdraw-${Date.now()}`,
    chainId: vaultConfig.chainId,
    networkClientId,
    status: TransactionStatus.unapproved,
    time: Date.now(),
    txParams: {
      from: moneyAccountAddress,
    },
    nestedTransactions: rawCalls,
  } as TransactionMeta;

  const delegation = await getDelegationTransaction(
    { messenger: messenger as unknown as DelegationMessenger },
    transactionMeta,
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
 * Builds the Money Account approve + vault-deposit calls used when a
 * confirmation pays *into* the money account after Relay (post-quote).
 *
 * @param messenger - Messenger used to resolve vault context and sign.
 * @param amountHuman - Human-readable mUSD amount.
 * @param atomic - Whether to wrap the calls in an EIP-7702 delegation.
 * @returns Deposit calls, the money-account recipient, and optional auth list.
 */
async function getMoneyAccountDepositPaymentOverrideData(
  messenger: MoneyPayMessenger,
  amountHuman: string,
  atomic: boolean,
): Promise<GetPaymentOverrideDataResponse> {
  const context = getMoneyPayContext(messenger);
  if (!context) {
    return { calls: [] };
  }

  const amount = parseMusdHumanAmountDown(amountHuman);
  if (amount === undefined) {
    return { calls: [] };
  }

  const { moneyAccountAddress, vaultConfig, networkClientId, provider } =
    context;
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
    toBatchCall(approveTx.params),
    toBatchCall(depositTx.params),
  ];

  if (!atomic) {
    return { calls: rawCalls, recipient: moneyAccountAddress };
  }

  const transactionMeta = {
    id: `money-account-deposit-${Date.now()}`,
    chainId: vaultConfig.chainId,
    networkClientId,
    status: TransactionStatus.unapproved,
    time: Date.now(),
    txParams: {
      from: moneyAccountAddress,
    },
    nestedTransactions: rawCalls,
  } as TransactionMeta;

  const delegation = await getDelegationTransaction(
    { messenger: messenger as unknown as DelegationMessenger },
    transactionMeta,
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
 * TransactionPayController callback: when `paymentOverride` is Money Account,
 * returns the vault calls that fund (withdraw) or receive (post-quote deposit)
 * the confirmation. Other overrides return an empty call list.
 *
 * `isPostQuote` selects deposit-into-vault; otherwise this is the withdraw
 * path used to fund Perps / Predict deposits from the money account.
 *
 * @param request - Pay-controller request with amount and transaction config.
 * @param messenger - Messenger used to resolve vault context and sign.
 * @returns Batch calls (and optional recipient / authorization) to prepend.
 */
export async function getPaymentOverrideData(
  request: GetPaymentOverrideDataRequest,
  messenger: MoneyPayMessenger,
): Promise<GetPaymentOverrideDataResponse> {
  const { amount, transaction, transactionData } = request;

  if (transactionData?.paymentOverride !== PaymentOverride.MoneyAccount) {
    return { calls: [] };
  }

  const atomic = transactionData.atomic !== false;

  if (transactionData.isPostQuote) {
    return await getMoneyAccountDepositPaymentOverrideData(
      messenger,
      amount,
      atomic,
    );
  }

  const recipient = transaction.txParams?.from;
  if (!isStrictHexString(recipient)) {
    return { calls: [] };
  }

  const calls = await getMoneyAccountWithdrawPaymentOverrideData(
    messenger,
    recipient,
    amount,
    atomic,
  );
  return { calls };
}
