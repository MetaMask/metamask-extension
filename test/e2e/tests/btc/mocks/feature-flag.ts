import { Mockttp, MockedEndpoint } from 'mockttp';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

// Feature flags for Bitcoin testing
export const BITCOIN_FEATURE_FLAGS = {
  sendRedesign: {
    enabled: true,
  },
  bitcoinAccounts: {
    enabled: true,
    minimumVersion: '13.6.0',
  },
};

/**
 * Mocks the feature flags endpoint for Bitcoin testing
 *
 * @param mockServer
 */
export async function mockBitcoinFeatureFlag(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: [BITCOIN_FEATURE_FLAGS],
    }));
}
