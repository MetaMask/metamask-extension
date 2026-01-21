import { Mockttp, MockedEndpoint } from 'mockttp';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

// BIP44 Stage 2 feature flags - enables automatic multichain account creation
export const BIP44_STAGE_TWO = {
  enableMultichainAccountsState2: {
    enabled: true,
    featureVersion: '2',
    minimumVersion: '12.19.0',
  },
  sendRedesign: {
    enabled: true,
  },
  bitcoinAccounts: {
    enabled: true,
    minimumVersion: '13.6.0',
  },
};

/**
 * Mocks the feature flags endpoint with BIP44 Stage 2 configuration
 * This enables automatic Bitcoin account creation
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
      json: [BIP44_STAGE_TWO],
    }));
}
