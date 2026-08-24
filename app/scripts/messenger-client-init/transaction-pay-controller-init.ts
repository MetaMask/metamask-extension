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
import { handleUnapprovedTransactionAddedForMoneyAccount } from '../lib/money/pay/account-override';
import { getMoneyAccountAmountData } from '../lib/money/pay/amount-data-callback';
import { createMoneyAccountDepositTransaction } from '../lib/money/pay/create-deposit-transaction';
import { createMoneyAccountWithdrawTransaction } from '../lib/money/pay/create-withdraw-transaction';
import { getMoneyAccountPaymentOverrideData } from '../lib/money/pay/payment-override-callback';
import { updateMoneyAccountDepositAmount } from '../lib/money/pay/update-deposit-amount';
import { updateMoneyAccountWithdrawAmount } from '../lib/money/pay/update-withdraw-amount';
import type { MoneyPayMessenger } from '../lib/money/pay/pay-context';
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
  }) => ReturnType<typeof getDelegationTransaction> = ({ transaction }) =>
    getDelegationTransaction(
      {
        messenger: initMessenger as DelegationMessenger,
      },
      transaction,
    );

  const messengerClient = new TransactionPayController({
    getAmountData: (amountDataRequest) =>
      getMoneyAccountAmountData(
        amountDataRequest,
        initMessenger as MoneyPayMessenger,
      ),
    getDelegationTransaction: getDelegationTransactionCallback,
    getPaymentOverrideData: (paymentOverrideRequest) =>
      getMoneyAccountPaymentOverrideData(
        paymentOverrideRequest,
        initMessenger as MoneyPayMessenger,
      ),
    getStrategy,
    messenger: controllerMessenger,
    state: persistedState.TransactionPayController,
  });

  initMessenger.subscribe(
    'TransactionController:unapprovedTransactionAdded',
    (transaction) =>
      handleUnapprovedTransactionAddedForMoneyAccount(
        messengerClient,
        initMessenger as MoneyPayMessenger,
        transaction,
      ),
  );

  const api = getApi(messengerClient, initMessenger as MoneyPayMessenger);

  return { messengerClient, api };
};

function getApi(
  messengerClient: TransactionPayController,
  moneyPayMessenger: MoneyPayMessenger,
): MessengerClientInitResult<TransactionPayController>['api'] {
  return {
    createMoneyAccountDepositTransaction: (batchId: Hex) =>
      createMoneyAccountDepositTransaction(moneyPayMessenger, batchId),
    createMoneyAccountWithdrawTransaction: () =>
      createMoneyAccountWithdrawTransaction(moneyPayMessenger),
    updateMoneyAccountWithdrawAmount: (
      transactionId: string,
      amountHuman: string,
    ) =>
      updateMoneyAccountWithdrawAmount(
        moneyPayMessenger,
        transactionId,
        amountHuman,
        // The recipient follows the account the confirmation displays, which
        // is the Pay override once the user picks one in the account row.
        messengerClient.state.transactionData?.[transactionId]?.accountOverride,
      ),
    updateMoneyAccountDepositAmount: (
      transactionId: string,
      amountHuman: string,
    ) =>
      updateMoneyAccountDepositAmount(
        moneyPayMessenger,
        transactionId,
        amountHuman,
      ),
    setTransactionPayIsMaxAmount: (
      transactionId: string,
      isMaxAmount: boolean,
    ) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.isMaxAmount = isMaxAmount;
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
    setTransactionPayPaymentOverride: (
      transactionId: string,
      {
        paymentOverride,
        refundTo,
      }: {
        paymentOverride?: PaymentOverride;
        refundTo?: Hex;
      } = {},
    ) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.paymentOverride = paymentOverride;
        if (paymentOverride === undefined) {
          config.refundTo = undefined;
          return;
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

function getStrategy(_transaction: TransactionMeta): TransactionPayStrategy {
  return TransactionPayStrategy.Relay;
}
