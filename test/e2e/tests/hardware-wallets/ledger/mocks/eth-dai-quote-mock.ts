import { ReadableStream as ReadableStreamWeb } from 'stream/web';
import { Readable } from 'stream';
import { Mockttp } from 'mockttp';
import { SSE_RESPONSE_HEADER } from '../../../bridge/constants';
import MOCK_SWAP_QUOTES_ETH_DAI from './swap-quotes-eth-dai.json';

const ETH_TOKEN = {
  assetId: 'eip155:1/slip44:60',
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  iconUrl: null,
};

const DAI_TOKEN = {
  assetId: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
  symbol: 'DAI',
  name: 'Dai Stablecoin',
  decimals: 18,
  iconUrl: null,
};

function mockSseEventSource(mockQuotes: unknown[], delayMs: number = 0) {
  let index = 0;
  return Readable.fromWeb(
    new ReadableStreamWeb({
      async pull(controller) {
        if (index === mockQuotes.length) {
          controller.close();
          return;
        }
        const quote = mockQuotes[index];
        controller.enqueue(Buffer.from(`event: quote\n`));
        controller.enqueue(
          Buffer.from(`id: ${Date.now().toString()}-${index + 1}\n`),
        );
        controller.enqueue(Buffer.from(`data: ${JSON.stringify(quote)}\n\n`));
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        index += 1;
      },
    }),
  );
}

/**
 * Bridge-style ETH → DAI quote mocks for Ledger swap E2E (unified swap flow).
 * @param mockServer
 */
export async function mockLedgerEthDaiSwapQuoteApis(mockServer: Mockttp) {
  await mockServer.forPost(/getTokens\/popular/u).thenCallback(() => ({
    statusCode: 200,
    json: [ETH_TOKEN, DAI_TOKEN],
  }));

  await mockServer.forPost(/getTokens\/search/u).thenCallback(() => ({
    statusCode: 200,
    json: {
      data: [ETH_TOKEN, DAI_TOKEN],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  }));

  await mockServer
    .forGet(/getQuoteStream/u)
    .always()
    .withQuery({
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      destTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    })
    .thenStream(
      200,
      mockSseEventSource(MOCK_SWAP_QUOTES_ETH_DAI, 0),
      SSE_RESPONSE_HEADER,
    );

  await mockServer
    .forGet(/getQuote(?!Stream)/u)
    .always()
    .withQuery({
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      destTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: MOCK_SWAP_QUOTES_ETH_DAI,
    }));
}
