import React from 'react';
import configureMockStore from 'redux-mock-store';
import nock from 'nock';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import NewNetworkInfo from './new-network-info';

const fetchWithCache =
  require('../../../helpers/utils/fetch-with-cache').default;

const state = {
  metamask: {
    provider: {
      ticker: 'ETH',
      nickname: '',
      chainId: '0x1',
      type: 'mainnet',
    },
    useTokenDetection: false,
    nativeCurrency: 'ETH',
  },
};

describe('NewNetworkInfo', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should render title', async () => {
    nock('https://token-api.metaswap.codefi.network')
      .get('/tokens/0x1')
      .reply(
        200,
        '[{"address":"0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f","symbol":"SNX","decimals":18,"name":"Synthetix Network Token","iconUrl":"https://assets.coingecko.com/coins/images/3406/large/SNX.png","aggregators":["aave","bancor","cmc","cryptocom","coinGecko","oneInch","paraswap","pmm","synthetix","zapper","zerion","zeroEx"],"occurrences":12},{"address":"0x1f9840a85d5af5bf1d1762f925bdaddc4201f984","symbol":"UNI","decimals":18,"name":"Uniswap","iconUrl":"https://images.prismic.io/token-price-prod/d0352dd9-5de8-4633-839d-bc3422c44d9c_UNI%404x.png","aggregators":["aave","bancor","cmc","cryptocom","coinGecko","oneInch","paraswap","pmm","zapper","zerion","zeroEx"],"occurrences":11}]',
      );

    const updateTokenDetectionSupportStatus = await fetchWithCache(
      'https://token-api.metaswap.codefi.network/tokens/0x1',
    );

    const store = configureMockStore()(
      state,
      updateTokenDetectionSupportStatus,
    );
    const { getByText } = renderWithProvider(<NewNetworkInfo />, store);

    expect(getByText('You have switched to')).toBeInTheDocument();
  });

  it('should render a question mark icon image', async () => {
    nock('https://token-api.metaswap.codefi.network')
      .get('/tokens/0x1')
      .reply(
        200,
        '[{"address":"0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f","symbol":"SNX","decimals":18,"name":"Synthetix Network Token","iconUrl":"https://assets.coingecko.com/coins/images/3406/large/SNX.png","aggregators":["aave","bancor","cmc","cryptocom","coinGecko","oneInch","paraswap","pmm","synthetix","zapper","zerion","zeroEx"],"occurrences":12},{"address":"0x1f9840a85d5af5bf1d1762f925bdaddc4201f984","symbol":"UNI","decimals":18,"name":"Uniswap","iconUrl":"https://images.prismic.io/token-price-prod/d0352dd9-5de8-4633-839d-bc3422c44d9c_UNI%404x.png","aggregators":["aave","bancor","cmc","cryptocom","coinGecko","oneInch","paraswap","pmm","zapper","zerion","zeroEx"],"occurrences":11}]',
      );

    const updateTokenDetectionSupportStatus = await fetchWithCache(
      'https://token-api.metaswap.codefi.network/tokens/0x1',
    );

    state.metamask.nativeCurrency = '';

    const store = configureMockStore()(
      state,
      updateTokenDetectionSupportStatus,
    );
    const { container } = renderWithProvider(<NewNetworkInfo />, store);
    const questionMark = container.querySelector('.fa fa-question-circle');

    expect(questionMark).toBeDefined();
  });

  it('should render Ethereum Mainnet caption', async () => {
    nock('https://token-api.metaswap.codefi.network')
      .get('/tokens/0x1')
      .reply(
        200,
        '[{"address":"0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f","symbol":"SNX","decimals":18,"name":"Synthetix Network Token","iconUrl":"https://assets.coingecko.com/coins/images/3406/large/SNX.png","aggregators":["aave","bancor","cmc","cryptocom","coinGecko","oneInch","paraswap","pmm","synthetix","zapper","zerion","zeroEx"],"occurrences":12},{"address":"0x1f9840a85d5af5bf1d1762f925bdaddc4201f984","symbol":"UNI","decimals":18,"name":"Uniswap","iconUrl":"https://images.prismic.io/token-price-prod/d0352dd9-5de8-4633-839d-bc3422c44d9c_UNI%404x.png","aggregators":["aave","bancor","cmc","cryptocom","coinGecko","oneInch","paraswap","pmm","zapper","zerion","zeroEx"],"occurrences":11}]',
      );

    const updateTokenDetectionSupportStatus = await fetchWithCache(
      'https://token-api.metaswap.codefi.network/tokens/0x1',
    );

    const store = configureMockStore()(
      state,
      updateTokenDetectionSupportStatus,
    );
    const { getByText } = renderWithProvider(<NewNetworkInfo />, store);

    expect(getByText('Ethereum Mainnet')).toBeInTheDocument();
  });

  it('should render things to keep in mind text', async () => {
    nock('https://token-api.metaswap.codefi.network')
      .get('/tokens/0x1')
      .reply(
        200,
        '[{"address":"0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f","symbol":"SNX","decimals":18,"name":"Synthetix Network Token","iconUrl":"https://assets.coingecko.com/coins/images/3406/large/SNX.png","aggregators":["aave","bancor","cmc","cryptocom","coinGecko","oneInch","paraswap","pmm","synthetix","zapper","zerion","zeroEx"],"occurrences":12},{"address":"0x1f9840a85d5af5bf1d1762f925bdaddc4201f984","symbol":"UNI","decimals":18,"name":"Uniswap","iconUrl":"https://images.prismic.io/token-price-prod/d0352dd9-5de8-4633-839d-bc3422c44d9c_UNI%404x.png","aggregators":["aave","bancor","cmc","cryptocom","coinGecko","oneInch","paraswap","pmm","zapper","zerion","zeroEx"],"occurrences":11}]',
      );

    const updateTokenDetectionSupportStatus = await fetchWithCache(
      'https://token-api.metaswap.codefi.network/tokens/0x1',
    );

    const store = configureMockStore()(
      state,
      updateTokenDetectionSupportStatus,
    );
    const { getByText } = renderWithProvider(<NewNetworkInfo />, store);

    expect(getByText('Things to keep in mind:')).toBeInTheDocument();
  });

  it('should render things to keep in mind text when token detection support is not available', async () => {
    nock('https://token-api.metaswap.codefi.network')
      .get('/tokens/0x3')
      .reply(200, '{"error":"ChainId 0x3 is not supported"}');

    const updateTokenDetectionSupportStatus = await fetchWithCache(
      'https://token-api.metaswap.codefi.network/tokens/0x3',
    );

    const store = configureMockStore()(
      state,
      updateTokenDetectionSupportStatus,
    );
    const { getByText } = renderWithProvider(<NewNetworkInfo />, store);

    expect(getByText('Things to keep in mind:')).toBeInTheDocument();
  });

  it('should not render first bullet when provider ticker is null', async () => {
    nock('https://token-api.metaswap.codefi.network')
      .get('/tokens/0x3')
      .reply(200, '{"error":"ChainId 0x3 is not supported"}');

    const updateTokenDetectionSupportStatus = await fetchWithCache(
      'https://token-api.metaswap.codefi.network/tokens/0x3',
    );

    state.metamask.provider.ticker = null;

    const store = configureMockStore()(
      state,
      updateTokenDetectionSupportStatus,
    );
    const { container } = renderWithProvider(<NewNetworkInfo />, store);
    const firstBox = container.querySelector('new-network-info__content-box-1');

    expect(firstBox).toBeNull();
  });

  it('should render click to manually add link', async () => {
    nock('https://token-api.metaswap.codefi.network')
      .get('/tokens/0x3')
      .reply(200, '{"error":"ChainId 0x3 is not supported"}');

    const updateTokenDetectionSupportStatus = await fetchWithCache(
      'https://token-api.metaswap.codefi.network/tokens/0x3',
    );

    const store = configureMockStore()(
      state,
      updateTokenDetectionSupportStatus,
    );
    const { getByText } = renderWithProvider(<NewNetworkInfo />, store);

    expect(getByText('Click here to manually add the tokens.')).toBeDefined();
  });
});
