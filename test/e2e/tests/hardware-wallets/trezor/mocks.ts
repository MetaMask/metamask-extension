import { MockttpServer } from 'mockttp';
import {
  mockEthDaiTrade,
  mockExternalAccountsAPI,
  mockIcon,
  mockPriceAPIs,
  mockSuggestedGasFees,
  mockSwapAggregatorMetadata,
  mockSwapFeatureFlags,
  mockSwapGasPrices,
  mockSwapNetworkInfo,
  mockSwapTokens,
  mockSwapTopAssets,
  mockTransactionRequestsBase,
} from '../swap-mocks';

export async function mockTrezorTransactionRequests(mockServer: MockttpServer) {
  await mockTransactionRequestsBase(mockServer);
  await mockEthDaiTrade(mockServer);

  await mockSwapNetworkInfo(mockServer);
  await mockSwapFeatureFlags(mockServer);
  await mockSwapTokens(mockServer);
  await mockSwapTopAssets(mockServer);
  await mockSwapAggregatorMetadata(mockServer);
  await mockSwapGasPrices(mockServer);

  await mockSuggestedGasFees(mockServer);
  await mockPriceAPIs(mockServer);

  await mockExternalAccountsAPI(mockServer);
  await mockIcon(mockServer);
}
