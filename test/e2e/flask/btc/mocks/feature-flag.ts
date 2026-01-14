import { Mockttp } from 'mockttp';
import { LEGACY_SEND_FEATURE_FLAG } from '../../../tests/send/common';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

// BIP44 Stage 2 flags - required for automatic BTC account creation
const BIP44_STAGE_TWO = {
  enableMultichainAccountsState2: {
    enabled: true,
    minimumVersion: '13.4.0',
  },
  bitcoinAccounts: {
    enabled: true,
    minimumVersion: '13.6.0',
  },
};

// Mock for Flask distribution
const mockBitcoinFeatureFlagFlask = (mockServer: Mockttp) =>
  mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'flask',
      environment: 'dev',
    })
    .thenCallback(() => ({
      ok: true,
      statusCode: 200,
      json: [{ ...BIP44_STAGE_TWO, ...LEGACY_SEND_FEATURE_FLAG }],
    }));

// Mock for Main distribution
const mockBitcoinFeatureFlagMain = (mockServer: Mockttp) =>
  mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => ({
      ok: true,
      statusCode: 200,
      json: [{ ...BIP44_STAGE_TWO, ...LEGACY_SEND_FEATURE_FLAG }],
    }));

// Export function that mocks both distributions
export const mockBitcoinFeatureFlag = async (mockServer: Mockttp) => {
  await mockBitcoinFeatureFlagFlask(mockServer);
  await mockBitcoinFeatureFlagMain(mockServer);
};
