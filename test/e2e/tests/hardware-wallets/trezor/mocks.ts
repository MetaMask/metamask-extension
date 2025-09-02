import { MockttpServer } from 'mockttp';
import {
  mockEthDaiTrade,
  mockExternalAccountsAPI,
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

  const tokenIconResponse = {
    statusCode: 200,
    body: 'fake-image-data',
    headers: { 'content-type': 'image/png' },
  };
  await mockServer
    .forGet(
      /https:\/\/static\.cx\.metamask\.io\/api\/v1\/tokenIcons\/\d+\/0x[a-fA-F0-9]{40}\.png/u,
    )
    .thenCallback(() => tokenIconResponse);
}
