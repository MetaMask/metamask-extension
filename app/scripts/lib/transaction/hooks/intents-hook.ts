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

    const intentQuotes = appStateControllerState.intentQuoteByTransaction?.[
      transactionId
    ] as {main: QuoteResponse | undefined; gas: QuoteResponse | undefined} | undefined;

    if (!intentQuotes) {
      log('No quotes found for transaction', transactionId);
      return EMPTY_RESULT;
    }

    const mainQuote = intentQuotes?.main as QuoteResponse;
    const gasQuote = intentQuotes?.gas;
    const isBridge = mainQuote.quote.srcChainId !== mainQuote.quote.destChainId;

    if (!isBridge) {
      log('Bridging not required');
      return EMPTY_RESULT;
    }

    if (gasQuote) {
      log('Submitting gas bridge', gasQuote);
      await this.submitBridge(gasQuote);
    }

    log('Submitting main bridge', mainQuote);
    await this.submitBridge(mainQuote);

    return EMPTY_RESULT;
  }

  async submitBridge(quote: QuoteResponse): Promise<void> {
    const finalQuote = this.normalizeQuote(quote);

    const result = await this.#messenger.call(
      'BridgeStatusController:submitTx',
      finalQuote as never,
      false,
    );

    log('Bridge transaction submitted', result);

    const { id: bridgeTransactionId } = result;

    log('Waiting for bridge completion', bridgeTransactionId);

    await this.waitForBridgeCompletion(bridgeTransactionId);
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

  normalizeQuote(quoteResponse: QuoteResponse): QuoteResponse {
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
