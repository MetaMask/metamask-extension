import {
  PaymentOverride,
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  type DelegationMessenger,
  getDelegationTransaction,
} from '../lib/transaction/delegation';
import { createMoneyAccountDepositTransaction } from '../lib/money/pay/create-deposit-transaction';
import { createMoneyAccountWithdrawTransaction } from '../lib/money/pay/create-withdraw-transaction';
import { getPaymentOverrideData } from '../lib/money/pay/payment-override-callback';
import {
  getMoneyAccountAmountData,
  updateMoneyAccountDepositAmount,
} from '../lib/money/pay/update-deposit-amount';
import { updateMoneyAccountWithdrawAmount } from '../lib/money/pay/update-withdraw-amount';
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
    createMoneyAccountWithdrawTransaction: async (accountOverride: Hex) => {
      const result =
        await createMoneyAccountWithdrawTransaction(moneyPayMessenger);
      seedAccountOverride(
        messengerClient,
        result.transactionId,
        accountOverride,
      );
      return result;
    },
    setTransactionPayIsMaxAmount: (
      transactionId: string,
      isMaxAmount: boolean,
      options: { isMoneyAccountDeposit?: boolean } = {},
    ) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.isMaxAmount = isMaxAmount;
        // Max money-account deposits run the vault deposit after Relay
        // settles (EXACT_INPUT). Regular deposits stay atomic so the vault
        // call is embedded in the Relay bundle (EXPECTED_OUTPUT).
        if (options.isMoneyAccountDeposit) {
          config.atomic = isMaxAmount ? false : undefined;
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
    setTransactionPayAccountOverride: (
      transactionId: string,
      accountOverride: Hex,
    ) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.accountOverride = accountOverride;
      });
    },
    updateMoneyAccountDepositAmount: (
      transactionId: string,
      amountHuman: string,
    ) =>
      updateMoneyAccountDepositAmount(
        moneyPayMessenger,
        transactionId,
        amountHuman,
      ),
    updateMoneyAccountWithdrawAmount: (
      transactionId: string,
      amountHuman: string,
      recipientOverride?: Hex,
    ) => {
      const resolvedRecipient =
        recipientOverride ??
        messengerClient.state?.transactionData?.[transactionId]
          ?.accountOverride;
      return updateMoneyAccountWithdrawAmount(
        moneyPayMessenger,
        transactionId,
        amountHuman,
        resolvedRecipient,
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
          config.atomic = undefined;
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
    updateTransactionPaymentToken:
      messengerClient.updatePaymentToken.bind(messengerClient),
  };
}

/**
 * Seeds Pay's funding/destination account. Money Account batches execute
 * `from` the money account, so without this override the confirmation From
 * row and Pay quotes fall back to that address instead of the user's
 * currently selected EVM account.
 *
 * @param messengerClient - TransactionPayController to write config on.
 * @param transactionId - Created transaction id.
 * @param accountOverride - Currently selected EVM account address.
 */
function seedAccountOverride(
  messengerClient: TransactionPayController,
  transactionId: string,
  accountOverride: Hex,
): void {
  messengerClient.setTransactionConfig(transactionId, (config) => {
    config.accountOverride = accountOverride;
  });
}

/**
 * Seeds deposit Pay config: funding account plus `isQuoteRequired`.
 *
 * Paying with same-chain mUSD is otherwise a Pay no-op (Strategy.None). The
 * publish hook then skips, so Add funds never moves mUSD from the selected
 * EOA onto the money account or embeds the vault calls. Forcing a quote
 * makes Relay own submit.
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
