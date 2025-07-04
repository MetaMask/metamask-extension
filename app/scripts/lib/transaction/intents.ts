import {
  BridgeController,
  GenericQuoteRequest,
  QuoteResponse,
  SortOrder,
  selectBridgeQuotes,
} from '@metamask/bridge-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { MetaMaskReduxState } from '../../metamask-controller';

const log = createProjectLogger('intents-utils');

export type BridgeQuoteRequest = {
  from: Hex;
  sourceChainId: Hex;
  sourceTokenAddress: Hex;
  sourceTokenAmount: string;
  targetChainId: Hex;
  targetTokenAddress: Hex;
};

export async function getBridgeQuotes(
  {
    bridgeController,
    getState,
  }: {
    bridgeController: BridgeController;
    getState: () => MetaMaskReduxState['metamask'];
  },
  requests: BridgeQuoteRequest[],
): Promise<(QuoteResponse | undefined)[]> {
  log('Fetching bridge quotes', requests);

  try {
    const normalizedRequests: GenericQuoteRequest[] = requests.map(
      (request) => {
        const {
          from,
          sourceChainId,
          sourceTokenAddress,
          sourceTokenAmount,
          targetChainId,
          targetTokenAddress,
        } = request;

        return {
          walletAddress: from,
          srcChainId: sourceChainId,
          srcTokenAddress: sourceTokenAddress,
          srcTokenAmount: sourceTokenAmount,
          destChainId: targetChainId,
          destTokenAddress: targetTokenAddress,
          insufficientBal: true,
          destWalletAddress: from,
          slippage: 0.5,
        };
      },
    );

    const results = await bridgeController.fetchQuotes(normalizedRequests);

    log('Fetched bridge quotes', results);

    return results.map((quotes) => {
      if (!quotes?.length) {
        return undefined;
      }

      const state = cloneDeep(getState());
      state.quotes = quotes;

      return (
        selectBridgeQuotes(state as never, {
          sortOrder: SortOrder.COST_ASC,
          selectedQuote: null,
        }).activeQuote ?? undefined
      );
    });
  } catch (error) {
    log('Error fetching bridge quotes:', error);
    return [];
  }
}
