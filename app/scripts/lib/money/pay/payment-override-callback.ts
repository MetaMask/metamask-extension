import { BigNumber } from 'bignumber.js';
import {
  buildMoneyAccountDepositBatch,
  buildMoneyAccountWithdrawBatch,
} from '@metamask/money-account-utils';
import {
  TransactionStatus,
  type BatchTransactionParams,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  type GetPaymentOverrideDataRequest,
  type GetPaymentOverrideDataResponse,
  PaymentOverride,
} from '@metamask/transaction-pay-controller';
import { isStrictHexString, type Hex } from '@metamask/utils';
import { getDelegationTransaction } from '../../transaction/delegation';
import { parseMusdHumanAmount } from './amount-commit';
import {
  getMoneyPayContext,
  type PaymentOverrideMessenger,
} from './pay-context';

const LOG_TAG = 'PaymentOverride';

/**
 * Converts prevalidated nested-transaction params into
 * {@link BatchTransactionParams} for Transaction Pay. Callers must only pass
 * values already produced by money-account batch builders (`to` is required;
 * `data` / `value` are optional hex strings). Unchecked `Hex` assertions match
 * that trusted builder contract.
 *
 * @param params - Prevalidated nested call params from a vault batch builder.
 * @param params.to - Call destination address.
 * @param params.data - Optional calldata.
 * @param params.value - Optional native value.
 * @returns Batch call params for Transaction Pay.
 */
function toBatchCall(params: {
  to?: string;
  data?: string;
  value?: string;
}): BatchTransactionParams {
  return {
    data: params.data as Hex | undefined,
    to: params.to as Hex,
    value: params.value as Hex | undefined,
  };
}

/**
 * Wraps raw vault calls in a fresh EIP-7702 delegation redeem call so Relay
 * can embed them. Preserves `authorizationList` from
 * {@link getDelegationTransaction} for accounts that still need an upgrade.
 *
 * @param messenger - Messenger with Money Pay and delegation capabilities.
 * @param options - Synthetic transaction identity for the delegation request.
 * @param options.chainId - Vault chain id.
 * @param options.from - Money account address that executes the batch.
 * @param options.idPrefix - Prefix for the synthetic transaction id.
 * @param options.nestedTransactions - Raw vault calls to wrap.
 * @param options.networkClientId - Network client for the vault chain.
 * @returns Redeem call plus optional authorization list.
 */
async function wrapCallsInDelegation(
  messenger: PaymentOverrideMessenger,
  {
    chainId,
    from,
    idPrefix,
    nestedTransactions,
    networkClientId,
  }: {
    chainId: Hex;
    from: Hex;
    idPrefix: string;
    nestedTransactions: BatchTransactionParams[];
    networkClientId: string;
  },
): Promise<
  Pick<GetPaymentOverrideDataResponse, 'authorizationList' | 'calls'>
> {
  const transactionMeta = {
    chainId,
    id: `${idPrefix}-${Date.now()}`,
    nestedTransactions,
    networkClientId,
    status: TransactionStatus.unapproved,
    time: Date.now(),
    txParams: {
      from,
    },
  } as TransactionMeta;

  const delegation = await getDelegationTransaction(
    { messenger },
    transactionMeta,
  );

  return {
    authorizationList: delegation.authorizationList,
    calls: [
      {
        data: delegation.data,
        to: delegation.to,
        value: delegation.value,
      },
    ],
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
 * @returns Batch calls (and optional authorization) to prepend.
 */
async function getMoneyAccountWithdrawPaymentOverrideData(
  messenger: PaymentOverrideMessenger,
  recipient: Hex,
  amountHuman: string,
  atomic: boolean,
): Promise<GetPaymentOverrideDataResponse> {
  const context = getMoneyPayContext(messenger);
  if (!context) {
    throw new Error(
      `${LOG_TAG} Money account payment override is not available`,
    );
  }

  const amount = parseMusdHumanAmount(amountHuman, BigNumber.ROUND_DOWN);
  if (amount === undefined) {
    return { calls: [] };
  }

  const { moneyAccountAddress, networkClientId, provider, vaultConfig } =
    context;
  const { transferTx, withdrawTx } = await buildMoneyAccountWithdrawBatch({
    accountantAddress: vaultConfig.accountantAddress,
    amount,
    chainId: vaultConfig.chainId,
    moneyAccountAddress,
    provider,
    recipient,
    tellerAddress: vaultConfig.tellerAddress,
  });

  const rawCalls: BatchTransactionParams[] = [
    toBatchCall(withdrawTx.params),
    toBatchCall(transferTx.params),
  ];

  if (!atomic) {
    return { calls: rawCalls };
  }

  return await wrapCallsInDelegation(messenger, {
    chainId: vaultConfig.chainId,
    from: moneyAccountAddress,
    idPrefix: 'money-account-withdraw',
    nestedTransactions: rawCalls,
    networkClientId,
  });
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
  messenger: PaymentOverrideMessenger,
  amountHuman: string,
  atomic: boolean,
): Promise<GetPaymentOverrideDataResponse> {
  const context = getMoneyPayContext(messenger);
  if (!context) {
    throw new Error(
      `${LOG_TAG} Money account payment override is not available`,
    );
  }

  const amount = parseMusdHumanAmount(amountHuman, BigNumber.ROUND_DOWN);
  if (amount === undefined) {
    return { calls: [] };
  }

  const { moneyAccountAddress, networkClientId, provider, vaultConfig } =
    context;
  const { approveTx, depositTx } = await buildMoneyAccountDepositBatch({
    accountantAddress: vaultConfig.accountantAddress,
    amount,
    boringVault: vaultConfig.boringVault,
    chainId: vaultConfig.chainId,
    lensAddress: vaultConfig.lensAddress,
    provider,
    tellerAddress: vaultConfig.tellerAddress,
  });

  const rawCalls: BatchTransactionParams[] = [
    toBatchCall(approveTx.params),
    toBatchCall(depositTx.params),
  ];

  if (!atomic) {
    return { calls: rawCalls, recipient: moneyAccountAddress };
  }

  const wrapped = await wrapCallsInDelegation(messenger, {
    chainId: vaultConfig.chainId,
    from: moneyAccountAddress,
    idPrefix: 'money-account-deposit',
    nestedTransactions: rawCalls,
    networkClientId,
  });

  return {
    ...wrapped,
    recipient: moneyAccountAddress,
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
  messenger: PaymentOverrideMessenger,
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

  return await getMoneyAccountWithdrawPaymentOverrideData(
    messenger,
    recipient,
    amount,
    atomic,
  );
}
