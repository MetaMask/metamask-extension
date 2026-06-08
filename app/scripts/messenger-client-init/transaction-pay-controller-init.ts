import {
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  type DelegationMessenger,
  getDelegationTransaction,
} from '../lib/transaction/delegation';
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

  const api = getApi(messengerClient);

  return { messengerClient, api };
};

function getApi(
  messengerClient: TransactionPayController,
): MessengerClientInitResult<TransactionPayController>['api'] {
  return {
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
    setTransactionPayConfig: (
      transactionId: string,
      options: { isPostQuote?: boolean; accountOverride?: string },
    ) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        if (options.isPostQuote !== undefined) {
          config.isPostQuote = options.isPostQuote;
        }
        if (options.accountOverride !== undefined) {
          config.accountOverride = options.accountOverride;
        }
      });
    },
    updateTransactionPaymentToken:
      messengerClient.updatePaymentToken.bind(messengerClient),
  };
}

function getStrategy(transaction: TransactionMeta): TransactionPayStrategy {
  if ((transaction.type as string) === 'metamaskPayTest') {
    return TransactionPayStrategy.Server;
  }
  return TransactionPayStrategy.Relay;
}
