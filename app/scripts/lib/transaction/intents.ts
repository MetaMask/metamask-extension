import {
  BridgeController,
  QuoteResponse,
  SortOrder,
  selectBridgeQuotes,
} from '@metamask/bridge-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { MetaMaskReduxState } from '../../metamask-controller';

const log = createProjectLogger('intents-utils');

const POLL_INTERVAL = 1000; // 1 Second
const MAX_POLL_COUNT = 10;

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
  try {
    let quotes = [];

    for (const request of requests) {
      const {
        from,
        sourceChainId,
        sourceTokenAddress,
        sourceTokenAmount,
        targetChainId,
        targetTokenAddress,
      } = request;

      bridgeController.resetState();

      await bridgeController.updateBridgeQuoteRequestParams(
        {
          walletAddress: from,
          srcChainId: sourceChainId,
          srcTokenAddress: sourceTokenAddress,
          srcTokenAmount: sourceTokenAmount,
          destChainId: targetChainId,
          destTokenAddress: targetTokenAddress,
          insufficientBal: true,
          destWalletAddress: from,
          slippage: 0.5,
        },
        {
          stx_enabled: false,
          token_symbol_source: '',
          token_symbol_destination: '',
          security_warnings: [],
        },
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 2000); // Wait for 1 second before requesting quotes
      });

      const activeQuote = await waitForQuoteOrTimeout(getState);

      quotes.push(activeQuote);
    }

    bridgeController.resetState();

    return quotes;
  } catch (error) {
    log('Error fetching bridge quotes:', error);
    return [];
  }
}

function waitForQuoteOrTimeout(
  getState: () => MetaMaskReduxState['metamask'],
): Promise<QuoteResponse | undefined> {
  let pollCount = 0;

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const activeQuote = selectBridgeQuotes(getState() as never, {
        sortOrder: SortOrder.COST_ASC,
        selectedQuote: null,
      }).activeQuote;

      if (activeQuote) {
        clearInterval(interval);
        resolve(activeQuote);
      }

      if (pollCount >= MAX_POLL_COUNT) {
        clearInterval(interval);
        resolve(undefined);
      }

      pollCount += 1;
    }, POLL_INTERVAL);
  });
}
