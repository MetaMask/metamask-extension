import {
  PaymentOverride,
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  getMoneyAccountFlow,
  MoneyAccountFlow,
} from '../../../shared/lib/money/money-account-flow';
import {
  type DelegationMessenger,
  getDelegationTransaction,
} from '../lib/transaction/delegation';
import { getBalance } from '../lib/money/pay/get-balance-callback';
import {
  clearMaxSourceBalance,
  setMaxSourceBalance,
} from '../lib/money/pay/max-source-balance';
import { createMoneyAccountDepositTransaction } from '../lib/money/pay/create-deposit-transaction';
import { createMoneyAccountWithdrawTransaction } from '../lib/money/pay/create-withdraw-transaction';
import { getPaymentOverrideData } from '../lib/money/pay/payment-override-callback';
import {
  getMoneyAccountAmountData,
  updateMoneyAccountDepositAmount,
} from '../lib/money/pay/update-deposit-amount';
import {
  syncMoneyAccountWithdrawTransfer,
  updateMoneyAccountWithdrawAmount,
  type WithdrawPaymentToken,
} from '../lib/money/pay/update-withdraw-amount';
import { subscribePersistPayMetadata } from '../lib/money/pay/persist-pay-metadata';
import type {
  MoneyPayMessenger,
  PaymentOverrideMessenger,
} from '../lib/money/pay/pay-context';
import type {
  MessengerClientInitFunction,
  MessengerClientInitResult,
} from './types';
import type { TransactionPayControllerInitMessenger } from './messengers';

export const TransactionPayControllerInit: MessengerClientInitFunction<
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayControllerInitMessenger
> = (request) => {
  const { controllerMessenger, initMessenger, persistedState } = request;

  const getDelegationTransactionCallback: (request: {
    transaction: TransactionMeta;
    isSubsidized?: boolean;
  }) => ReturnType<typeof getDelegationTransaction> = ({
    transaction,
    isSubsidized,
  }) =>
    getDelegationTransaction(
      {
        messenger: initMessenger as DelegationMessenger,
        isSubsidized,
      },
      transaction,
    );

  const messengerClient = new TransactionPayController({
    getAmountData: (amountDataRequest) =>
      getMoneyAccountAmountData(
        initMessenger as MoneyPayMessenger,
        amountDataRequest,
      ),
    getBalance,
    getDelegationTransaction: getDelegationTransactionCallback,
    getPaymentOverrideData: (paymentOverrideRequest) =>
      getPaymentOverrideData(
        paymentOverrideRequest,
        initMessenger as PaymentOverrideMessenger,
      ),
    getStrategy,
    messenger: controllerMessenger,
    state: persistedState.TransactionPayController,
  });

  subscribePersistPayMetadata(controllerMessenger);
  subscribeWithdrawTransferSync(
    controllerMessenger,
    messengerClient,
    initMessenger as MoneyPayMessenger,
  );

  const api = getApi(messengerClient, initMessenger as MoneyPayMessenger);

  return { messengerClient, api };
};

function getApi(
  messengerClient: TransactionPayController,
  moneyPayMessenger: MoneyPayMessenger,
): MessengerClientInitResult<TransactionPayController>['api'] {
  return {
    createMoneyAccountDepositTransaction: async (
      batchId: Hex,
      accountOverride: Hex,
    ) => {
      const result = await createMoneyAccountDepositTransaction(
        moneyPayMessenger,
        batchId,
      );
      seedDepositPayConfig(
        messengerClient,
        result.transactionId,
        accountOverride,
      );
      return result;
    },
    createMoneyAccountWithdrawTransaction: async (recipient: Hex) => {
      const result =
        await createMoneyAccountWithdrawTransaction(moneyPayMessenger);
      seedWithdrawPayConfig(messengerClient, result.transactionId, recipient);
      return result;
    },
    setTransactionPayIsMaxAmount: (
      transactionId: string,
      isMaxAmount: boolean,
      options: {
        isAtomicMaxAllowed?: boolean;
        isMoneyAccountDeposit?: boolean;
        sourceAccountAddress?: string;
        sourceBalanceRaw?: string;
        sourceChainId?: string;
        sourceTokenAddress?: string;
      } = {},
    ) => {
      // Deposit Max quotes the funding-account balance, which the controller's
      // own pay-token snapshot does not hold reliably. Record what the UI
      // resolved so the getBalance callback can supply it (see
      // max-source-balance).
      if (options.isMoneyAccountDeposit) {
        if (isMaxAmount && options.sourceBalanceRaw) {
          setMaxSourceBalance(
            {
              transactionId,
              accountAddress: options.sourceAccountAddress,
              chainId: options.sourceChainId,
              tokenAddress: options.sourceTokenAddress,
            },
            options.sourceBalanceRaw,
          );
        } else {
          clearMaxSourceBalance(transactionId);
        }
      }

      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.isMaxAmount = isMaxAmount;

        if (options.isMoneyAccountDeposit) {
          // Leave `atomic` unset when Core may quote Max atomically: the route
          // match only predicts the subsidy, and Core verifies it and re-quotes
          // non-atomically when the response is unsubsidized.
          config.atomic =
            isMaxAmount && !options.isAtomicMaxAllowed ? false : undefined;
        }
      });
    },
    setTransactionPayAtomic: (transactionId: string, isAllowed: boolean) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        if (config.isMaxAmount) {
          config.atomic = isAllowed ? undefined : false;
        }
      });
    },
    setTransactionPayPostQuote: (
      transactionId: string,
      options: { isHyperliquidSource?: boolean } = {},
    ) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.isPostQuote = true;
        if (options.isHyperliquidSource) {
          config.isHyperliquidSource = true;
        }
      });
    },
    setTransactionPayAccountOverride: async (
      transactionId: string,
      accountOverride: Hex,
    ) => {
      const transaction = moneyPayMessenger
        .call('TransactionController:getState')
        .transactions.find(({ id }) => id === transactionId);

      if (getMoneyAccountFlow(transaction) !== MoneyAccountFlow.Withdraw) {
        messengerClient.setTransactionConfig(transactionId, (config) => {
          config.accountOverride = accountOverride;
        });
        return;
      }

      seedWithdrawPayConfig(messengerClient, transactionId, accountOverride);
      await syncWithdrawTransfer(
        messengerClient,
        moneyPayMessenger,
        transactionId,
      );
    },
    updateMoneyAccountDepositAmount: async (
      transactionId: string,
      amountHuman: string,
    ) => {
      // Refresh the payment-token snapshot before committing so source amounts
      // can use a current balanceRaw. Prefill often runs while the snapshot is
      // still 0/stale (tx `from` is the vault).
      // `updatePaymentToken` is synchronous: it resolves the token and writes
      // state before returning, so the refresh cannot land after the amount
      // commit below and only throws synchronously.
      const paymentToken =
        messengerClient.state?.transactionData?.[transactionId]?.paymentToken;
      if (paymentToken) {
        try {
          messengerClient.updatePaymentToken({
            transactionId,
            tokenAddress: paymentToken.address,
            chainId: paymentToken.chainId,
          });
        } catch {
          // Balance/rates may still be settling; amount commit below still runs.
        }
      }

      // Re-assert quote-required on every amount update so confirmations
      // created before seedDepositPayConfig still quote. Leave atomic and
      // isMaxAmount alone — Max / uncapped 100% prefill set those separately.
      // Forcing `atomic: false` here made Relay quote EXACT_INPUT for every
      // typed amount (no embedded vault txs). Non-max deposits must stay
      // atomic so Relay uses EXACT_OUTPUT, matching mobile.
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.isQuoteRequired = true;
      });
      return updateMoneyAccountDepositAmount(
        moneyPayMessenger,
        transactionId,
        amountHuman,
      );
    },
    updateMoneyAccountWithdrawAmount: (
      transactionId: string,
      amountHuman: string,
      recipientOverride?: Hex,
    ) => {
      const transactionData =
        messengerClient.state?.transactionData?.[transactionId];
      return updateMoneyAccountWithdrawAmount(
        moneyPayMessenger,
        transactionId,
        amountHuman,
        recipientOverride ?? transactionData?.accountOverride,
        getWithdrawPaymentToken(transactionData),
      );
    },
    setTransactionPayPaymentOverride: (
      transactionId: string,
      {
        atomic,
        paymentOverride,
        refundTo,
      }: {
        atomic?: boolean;
        paymentOverride?: PaymentOverride;
        refundTo?: Hex;
      } = {},
    ) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.paymentOverride = paymentOverride;
        if (paymentOverride === undefined) {
          const transaction = moneyPayMessenger
            .call('TransactionController:getState')
            .transactions.find(({ id }) => id === transactionId);
          // An armed Max deposit already holds the correct hint (`false`, or
          // `undefined` when Core may quote it atomically). Clearing the
          // override must not re-derive it.
          const keepAtomicHint =
            config.isMaxAmount &&
            getMoneyAccountFlow(transaction) === MoneyAccountFlow.Deposit;
          if (!keepAtomicHint) {
            config.atomic = undefined;
          }
          config.refundTo = undefined;
          return;
        }
        if (atomic !== undefined) {
          config.atomic = atomic;
        }
        if (refundTo !== undefined) {
          config.refundTo = refundTo;
        }
      });
    },
  };
}

/**
 * Re-encodes a withdraw transfer whenever its payment token changes, since
 * the target depends on whether the new token is quoted.
 *
 * @param controllerMessenger - Transaction Pay controller messenger.
 * @param messengerClient - TransactionPayController to read config from.
 * @param moneyPayMessenger - Messenger used to encode and commit.
 */
function subscribeWithdrawTransferSync(
  controllerMessenger: TransactionPayControllerMessenger,
  messengerClient: TransactionPayController,
  moneyPayMessenger: MoneyPayMessenger,
): void {
  const paymentTokenKeys = new Map<string, string | undefined>();

  controllerMessenger.subscribe(
    'TransactionPayController:stateChange',
    ({ transactionData }: TransactionPayController['state']) => {
      for (const transactionId of paymentTokenKeys.keys()) {
        if (!transactionData[transactionId]) {
          paymentTokenKeys.delete(transactionId);
        }
      }

      for (const [transactionId, { paymentToken }] of Object.entries(
        transactionData,
      )) {
        const key = paymentToken
          ? `${paymentToken.chainId}:${paymentToken.address.toLowerCase()}`
          : undefined;

        if (
          paymentTokenKeys.has(transactionId) &&
          paymentTokenKeys.get(transactionId) === key
        ) {
          continue;
        }

        paymentTokenKeys.set(transactionId, key);
        syncWithdrawTransfer(messengerClient, moneyPayMessenger, transactionId);
      }
    },
  );
}

function getWithdrawPaymentToken(
  transactionData:
    | TransactionPayController['state']['transactionData'][string]
    | undefined,
): WithdrawPaymentToken | undefined {
  const paymentToken = transactionData?.paymentToken;
  return paymentToken
    ? { address: paymentToken.address, chainId: paymentToken.chainId }
    : undefined;
}

async function syncWithdrawTransfer(
  messengerClient: TransactionPayController,
  moneyPayMessenger: MoneyPayMessenger,
  transactionId: string,
): Promise<void> {
  const transactionData =
    messengerClient.state?.transactionData?.[transactionId];

  try {
    await syncMoneyAccountWithdrawTransfer(
      moneyPayMessenger,
      transactionId,
      transactionData?.accountOverride,
      getWithdrawPaymentToken(transactionData),
    );
  } catch (error) {
    console.error('Money Account withdraw: transfer sync failed', error);
  }
}

/**
 * Seeds Pay's withdraw recipient. Without this override the confirmation
 * account row falls back to the money account instead of the user's
 * currently selected EVM account. Pay only sends the output there; quotes
 * are requested and submitted from the money account.
 *
 * @param messengerClient - TransactionPayController to write config on.
 * @param transactionId - Withdrawal transaction id.
 * @param recipient - Account that receives the withdrawal.
 */
function seedWithdrawPayConfig(
  messengerClient: TransactionPayController,
  transactionId: string,
  recipient: Hex,
): void {
  messengerClient.setTransactionConfig(transactionId, (config) => {
    config.accountOverride = recipient;
  });
}

/**
 * Seeds deposit Pay config: funding account and `isQuoteRequired`.
 *
 * Paying with same-chain mUSD is otherwise a Pay no-op (Strategy.None). The
 * publish hook then skips, so Add funds never moves mUSD from the selected
 * EOA onto the money account or embeds the vault calls. Forcing a quote
 * makes Relay own submit.
 *
 * Leave `atomic` unset. Relay embeds the vault calls for EXACT_OUTPUT only
 * on the atomic path. `atomic: false` is Max-only (exact source spend /
 * EXACT_INPUT), matching mobile `setIsMax`.
 *
 * @param messengerClient - TransactionPayController to write config on.
 * @param transactionId - Created transaction id.
 * @param accountOverride - Currently selected EVM account address.
 */
function seedDepositPayConfig(
  messengerClient: TransactionPayController,
  transactionId: string,
  accountOverride: Hex,
): void {
  messengerClient.setTransactionConfig(transactionId, (config) => {
    config.accountOverride = accountOverride;
    config.isQuoteRequired = true;
  });
}

function getStrategy(_transaction: TransactionMeta): TransactionPayStrategy {
  return TransactionPayStrategy.Relay;
}
