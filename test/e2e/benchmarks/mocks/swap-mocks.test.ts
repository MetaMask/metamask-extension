import bridgeNetworkTokens from './bridge-network-tokens.json';
import bridgeTokens from './bridge-tokens.json';
import bridgeTokensPopular from './bridge-tokens-popular.json';
import bridgeTokensSearch from './bridge-tokens-search.json';
import swapQuoteEthUsdc from './swap-quote-eth-usdc.json';
import swapQuoteSolUsdc from './swap-quote-sol-usdc.json';
import { getSwapBenchmarkInterceptorResponse } from './swap-mocks';

describe('getSwapBenchmarkInterceptorResponse', () => {
  it('returns the Solana SSE quote fixture for Solana quote streams', () => {
    const result = getSwapBenchmarkInterceptorResponse({
      method: 'GET',
      url: 'https://bridge.api.cx.metamask.io/getQuoteStream?srcChainId=1151111081099710',
    });

    expect(result?.response.statusCode).toBe(200);
    expect(result?.response.body).toContain(JSON.stringify(swapQuoteSolUsdc));
  });

  it('returns the Ethereum quote fixture for REST quote fallbacks', () => {
    const result = getSwapBenchmarkInterceptorResponse({
      method: 'GET',
      url: 'https://bridge.api.cx.metamask.io/getQuote?srcChainId=1',
    });

    expect(result?.response.json).toStrictEqual([swapQuoteEthUsdc]);
  });

  it('covers all bridge token list request variants used by the swap benchmark', () => {
    expect(
      getSwapBenchmarkInterceptorResponse({
        method: 'POST',
        url: 'https://bridge.api.cx.metamask.io/getTokens/popular',
      })?.response.json,
    ).toStrictEqual(bridgeTokensPopular);

    expect(
      getSwapBenchmarkInterceptorResponse({
        method: 'POST',
        url: 'https://bridge.api.cx.metamask.io/getTokens/search',
      })?.response.json,
    ).toStrictEqual(bridgeTokensSearch);

    expect(
      getSwapBenchmarkInterceptorResponse({
        method: 'GET',
        url: 'https://bridge.api.cx.metamask.io/getTokens',
      })?.response.json,
    ).toStrictEqual(bridgeTokens);

    expect(
      getSwapBenchmarkInterceptorResponse({
        method: 'GET',
        url: 'https://bridge.api.cx.metamask.io/networks/1/tokens',
      })?.response.json,
    ).toStrictEqual(bridgeNetworkTokens);
  });
});
