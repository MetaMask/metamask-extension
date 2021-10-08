/**
 * @file Entrypoint for the background process during e2e tests. Sets up fetch mocks then imports the background module.
 */

import { rest, setupWorker } from 'msw';
import config from 'eth-phishing-detect/src/config.json';
import fetchMockResponses from '../../test/data/fetch-mocks.json';

function fail(_request, response, context) {
  return response(context.status(500));
}

const handlers = [
  // Allow all internal extension traffic
  rest.get('chrome-extension://*', () => null),
  rest.get('moz-extension://*', () => null),
  // Allow traffic to ganache
  rest.get('http://localhost:8545/*', () => null),
  rest.post('http://localhost:8545/*', () => null),
  // Allow traffic to fixture server
  rest.get('http://localhost:12345/*', () => null),
  rest.post('http://localhost:12345/*', () => null),

  // JSDelivr
  // We use this service to cache our phishing config.
  rest.get(
    'https://cdn.jsdelivr.net/gh/MetaMask/eth-phishing-detect@master/src/config.json',
    (_request, response, context) => {
      return response(context.json(config));
    },
  ),

  // CryptoCompare
  // We use this API to get the conversion rate between the "primary currency" (e.g. fiat) and the network currency (e.g. ETH)
  rest.get(
    'https://min-api.cryptocompare.com/data/price',
    (request, response, context) => {
      const query = request.url.searchParams;
      const networkCurrency = query.get('fsym');
      const primaryCurrency = query.get('tsyms');

      if (primaryCurrency === 'USD') {
        return response(context.json({ USD: 400 }));
      } else if (primaryCurrency === 'PHP') {
        return response(context.json({ PHP: 400 }));
      }
      return response(
        context.json({
          Response: 'Error',
          Type: 1,
          Message: `cccagg_or_exchange market does not exist for this coin pair (${networkCurrency}-${primaryCurrency})`,
        }),
      );
    },
  ),

  // CoinGecko
  // We use this API to get the conversion rates for tokens to the current network currency (e.g. DAI to ETH).
  rest.get('https://api.coingecko.com/api/v3/*', fail),

  // Swaps
  // We use these APIs for swaps (one API per network).
  rest.get('https://api.metaswap.codefi.network/*', fail),
  rest.get('https://bsc-api.metaswap.codefi.network/*', fail),

  // Legacy gas price estimates
  // We use this API to get gas price estimates on certain networks that don't support EIP-1559.
  rest.get(
    'https://gas-api.metaswap.codefi.network/networks/:chainId/gasPrices',
    (_request, response, context) => {
      return response(context.json(fetchMockResponses.legacyGasFee));
    },
  ),

  // Token API
  // We use this API to get the list of tokens for the current network.
  // If the `address` query parameter is used, we return the metadata for just that token instead.
  rest.get(
    'https://token-api.metaswap.codefi.network/tokens/:chainId',
    (request, response, context) => {
      const query = request.url.searchParams;
      const tokenAddress = query.get('address');

      if (tokenAddress) {
        if (fetchMockResponses.tokenList[tokenAddress]) {
          return response(
            context.json(fetchMockResponses.tokenList[tokenAddress]),
          );
        }
        return response(context.status(404));
      }
      return response(context.json(fetchMockResponses.tokenList));
    },
  ),

  // Etherscan
  // We use this API to get incoming transactions for the current account and network.
  rest.get('https://api.etherscan.io/api', fail),

  // Infura (Mainnet)
  // This is our default network. We should be using ganache rather than Infura in most e2e tests, but some briefly select Mainnet.
  rest.post('https://mainnet.infura.io/v3/*', fail),
];

const worker = setupWorker(...handlers);

async function startWorker() {
  await worker.start({
    serviceWorker: {
      url: '/mock-service-worker.js',
    },
  });

  globalThis.msw = {
    worker,
    rest,
  };
}

startWorker()
  .then(() => {
    import('./background');
  })
  .catch((error) => {
    console.error(error);
  });
