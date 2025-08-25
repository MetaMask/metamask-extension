import nock from 'nock';
import {
  TOKENS_API_MOCK_RESULT,
  TOP_ASSETS_API_MOCK_RESULT,
  GAS_PRICE_API_MOCK_RESULT,
  TRADES_API_MOCK_RESULT,
  NETWORKS_2_API_MOCK_RESULT,
  AGGREGATOR_METADATA_API_MOCK_RESULT,
  FEATURE_FLAGS_API_MOCK_RESULT,
} from '../../data/mock-data';

export function mockSwapsTokens() {
  const mockEndpoint = nock('https://bridge.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1/tokens')
    .query({
      includeBlockedTokens: true,
    })
    .reply(200, TOKENS_API_MOCK_RESULT);
  return mockEndpoint;
}

export function mockSwapsFeatureFlags() {
  const mockEndpoint = nock('https://bridge.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/featureFlags')
    .reply(200, FEATURE_FLAGS_API_MOCK_RESULT);
  return mockEndpoint;
}

export function mockSwapsAggregatorMetadata() {
  const mockEndpoint = nock('https://bridge.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1/aggregatorMetadata')
    .reply(200, AGGREGATOR_METADATA_API_MOCK_RESULT);
  return mockEndpoint;
}

export function mockSwapsTopAssets() {
  const mockEndpoint = nock('https://bridge.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1/topAssets')
    .reply(200, TOP_ASSETS_API_MOCK_RESULT);
  return mockEndpoint;
}

export function mockSwapsGasPrices() {
  const mockEndpoint = nock('https://gas.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1/gasPrices')
    .reply(200, GAS_PRICE_API_MOCK_RESULT);
  return mockEndpoint;
}

export function mockSwapsTrades() {
  const mockEndpoint = nock('https://bridge.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1/trades')
    .reply(200, TRADES_API_MOCK_RESULT);
  return mockEndpoint;
}

export function mockSwapsNetworks() {
  const mockEndpoint = nock('https://bridge.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1')
    .reply(200, NETWORKS_2_API_MOCK_RESULT);
  return mockEndpoint;
}

export function mockSwapsToken() {
  const mockEndpoint = nock('https://token.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/token/1337')
    .reply(200, {});
  return mockEndpoint;
}
