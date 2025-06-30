import {
  PublishHook,
  PublishHookResult,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { createProjectLogger } from '@metamask/utils';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import {
  QuoteMetadata,
  QuoteResponse,
  StatusTypes,
  TxData,
} from '@metamask/bridge-controller';
import { BridgeStatusController } from '@metamask/bridge-status-controller';
import { cloneDeep } from 'lodash';

const log = createProjectLogger('intents-publish-hook');

const GAS_MULTIPLIER = 3.0;
const STATUS_INTERVAL = 5 * 1000; // 5 Seconds

const EMPTY_RESULT = {
  transactionHash: undefined,
};

type IntentQuote = QuoteResponse<string | TxData> & QuoteMetadata;

export class IntentsHook {
  #bridgeStatusController: BridgeStatusController;

  #messenger: TransactionControllerInitMessenger;

  constructor({
    bridgeStatusController,
    messenger,
  }: {
    bridgeStatusController: BridgeStatusController;
    messenger: TransactionControllerInitMessenger;
  }) {
    this.#bridgeStatusController = bridgeStatusController;
    this.#messenger = messenger;
  }

  getHook(): PublishHook {
    return this.#hookWrapper.bind(this);
  }

  async #hookWrapper(
    transactionMeta: TransactionMeta,
    _signedTx: string,
  ): Promise<PublishHookResult> {
    try {
      return await this.#publishHook(transactionMeta, _signedTx);
    } catch (error) {
      log('Error', error);
      throw error;
    }
  }

  async #publishHook(
    transactionMeta: TransactionMeta,
    _signedTx: string,
  ): Promise<PublishHookResult> {
    const { id: transactionId } = transactionMeta;

    const appStateControllerState = await this.#messenger.call(
      'AppStateController:getState',
    );

    const intentQuote = appStateControllerState.intentQuoteByTransaction?.[
      transactionId
    ] as (QuoteResponse<string | TxData> & QuoteMetadata) | undefined;

    if (!intentQuote) {
      log('No quote found for transaction', transactionId);
      return EMPTY_RESULT;
    }

    log('Intent quote', intentQuote);

    const isBridge =
      intentQuote.quote.srcChainId !== intentQuote.quote.destChainId;

    if (!isBridge) {
      log('Bridging not required');
      return EMPTY_RESULT;
    }

    const finalQuote = this.normalizeQuote(intentQuote);

    log('Final quote', finalQuote);

    const result = await this.#messenger.call(
      'BridgeStatusController:submitTx',
      finalQuote,
      false,
    );

    const { id: bridgeTransactionId } = result;

    log('Waiting for bridge completion', bridgeTransactionId);

    await this.waitForBridgeCompletion(bridgeTransactionId);

    log('Safe delay');

    await new Promise((resolve) => setTimeout(resolve, 5000));

    return EMPTY_RESULT;
  }

  async waitForBridgeCompletion(transactionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        try {
          const bridgeHistory =
            this.#bridgeStatusController.state.txHistory[transactionId];

          const status = bridgeHistory?.status?.status;

          log('Checking bridge status', status);

          if (status === StatusTypes.COMPLETE) {
            clearInterval(intervalId);
            resolve();
          }

          if (status === StatusTypes.FAILED) {
            clearInterval(intervalId);
            reject(new Error('Bridge transaction failed'));
          }
        } catch (error) {
          log('Error checking bridge status', error);
          clearInterval(intervalId);
          reject(error);
        }
      }, STATUS_INTERVAL);
    });
  }

  normalizeQuote(quoteResponse: IntentQuote): IntentQuote {
    const finalQuote = cloneDeep(quoteResponse);
    const trade = finalQuote.trade as TxData;
    const approval = finalQuote.approval as TxData | undefined;

    if (trade.gasLimit) {
      trade.gasLimit = Math.ceil(trade.gasLimit * GAS_MULTIPLIER);
    }

    if (approval?.gasLimit) {
      approval.gasLimit = Math.ceil(approval.gasLimit * GAS_MULTIPLIER);
    }

    return finalQuote;
  }
}
