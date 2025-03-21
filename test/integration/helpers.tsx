import nock from 'nock';
import {TOP_ASSETS_API_MOCK_RESULT,
  FEATURE_FLAGS_API_MOCK_RESULT,
  TOKENS_API_MOCK_RESULT,
  AGGREGATOR_METADATA_API_MOCK_RESULT,
  GAS_PRICE_API_MOCK_RESULT,
  TRADES_API_MOCK_RESULT,
  NETWORKS_2_API_MOCK_RESULT,
} from '../data/mock-data';

import data from "../data/mockAggregatorData.json"

export const createMockImplementation = <T,>(requests: Record<string, T>) => {
  return (method: string): Promise<T | undefined> => {
    if (method in requests) {
      return Promise.resolve(requests[method]);
    }
    return Promise.resolve(undefined);
  };
};

export function mock4byte(hexSignature: string, textSignature?: string) {
  const mockEndpoint = nock('https://www.4byte.directory:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/api/v1/signatures/')
    .query({ hex_signature: hexSignature })
    .reply(200, {
      results: [
        {
          id: 235447,
          created_at: '2021-09-14T02:07:09.805000Z',
          text_signature: textSignature ?? 'mintNFTs(uint256)',
          hex_signature: hexSignature,
          bytes_signature: ';K\u0013 ',
        },
      ],
    });
  return mockEndpoint;
}

export function mockSwapsTokens() {
  const mockEndpoint = nock('https://swap.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1/tokens')
    .query({
      includeBlockedTokens: true,
    })
    .reply(200, {
      results: TOKENS_API_MOCK_RESULT,
    });
  return mockEndpoint;
}

export function mockSwapsFeatureFlags() {
  const mockEndpoint = nock('https://swap.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/featureFlags')
    .reply(200, {
      results: FEATURE_FLAGS_API_MOCK_RESULT,
    });
  return mockEndpoint;
}

export function mockSwapsAggregatorMetadata() {
  const mockEndpoint = nock('https://swap.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1/aggregatorMetadata')
    .reply(200, {
      results: data,
    });
  return mockEndpoint;
}

export function mockSwapsTopAssets() {
  const mockEndpoint = nock('https://swap.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1/topAssets')
    .reply(200, {
      results: TOP_ASSETS_API_MOCK_RESULT,
    });
  return mockEndpoint;
}

export function mockSwapsGasPrices() {
  const mockEndpoint = nock('https://gas.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1/gasPrices')
    .reply(200, {
      results: GAS_PRICE_API_MOCK_RESULT,
    });
  return mockEndpoint;
}

export function mockSwapsTrades() {
  const mockEndpoint = nock('https://swap.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1/trades')
    .reply(200, {
      results: TRADES_API_MOCK_RESULT,
    });
  return mockEndpoint;
}

export function mockSwapsNetworks() {
  const mockEndpoint = nock('https://swap.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/networks/1')
    .reply(200, {
      results: NETWORKS_2_API_MOCK_RESULT,
    });
  return mockEndpoint;
}

export function mockSwapsToken() {
  const mockEndpoint = nock('https://token.api.cx.metamask.io:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/token/1337')
    .reply(200, {
      results: {},
    });
  return mockEndpoint;
}
