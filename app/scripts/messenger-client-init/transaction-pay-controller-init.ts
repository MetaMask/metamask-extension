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
    getDelegationTransaction: getDelegationTransactionCallback,
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
    createMoneyAccountDepositTransaction: (batchId: Hex) =>
      createMoneyAccountDepositTransaction(moneyPayMessenger, batchId),
    createMoneyAccountWithdrawTransaction: () =>
      createMoneyAccountWithdrawTransaction(moneyPayMessenger),
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
