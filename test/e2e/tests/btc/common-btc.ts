import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import NetworkManager from '../../page-objects/pages/network-manager';
import {
  mockBitcoinFeatureFlag,
  mockExchangeRates,
  mockCurrencyExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockBtcSpotPrices,
  mockSupportedVsCurrencies,
  mockAllBridgeEndpoints,
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

/**
 * Options for configuring the BTC account snap test environment.
 */
export type BtcAccountSnapOptions = {
  /** Enable swap/bridge mocks for testing BTC swaps */
  mockSwap?: boolean;
  /** If mockSwap is true, whether to return quotes (default: true) */
  mockSwapQuotes?: boolean;
};

export async function withBtcAccountSnap(
  test: (driver: Driver, mockServer: Mockttp) => Promise<void>,
  title?: string,
  options: BtcAccountSnapOptions = {},
) {
  const { mockSwap = false, mockSwapQuotes = true } = options;

  await withFixtures(
    {
      // Use onboarding flow to trigger fullScan (not sync)
      onboarding: true,
      title,
      dappOptions: { numberOfTestDapps: 1 },
      manifestFlags: {
        remoteFeatureFlags: {
          bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
          sendRedesign: { enabled: true },
          ...(mockSwap && { bitcoinSwaps: { enabled: true } }),
        },
      },
      testSpecificMock: async (mockServer: Mockttp) => {
        const mocks = [
          await mockBitcoinFeatureFlag(mockServer),
          await mockInitialFullScan(mockServer),
          await mockExchangeRates(mockServer),
          await mockCurrencyExchangeRates(mockServer),
          await mockFiatExchangeRates(mockServer),
          await mockSolanaSpotPrices(mockServer),
          await mockSupportedVsCurrencies(mockServer),
          await mockPriceMulti(mockServer),
          await mockPriceMultiBtcAndSol(mockServer),
        ];

        // Add bridge mocks for swap functionality if enabled
        if (mockSwap) {
          mocks.push(
            await mockBtcSpotPrices(mockServer),
            ...(await mockAllBridgeEndpoints(mockServer, {
              returnQuotes: mockSwapQuotes,
            })),
          );
        }

        return mocks;
      },
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      // Complete onboarding - this triggers fullScan for Bitcoin snap
      await completeImportSRPOnboardingFlow({ driver });

      // Switch to Bitcoin network
      const networkManager = new NetworkManager(driver);
      await networkManager.openNetworkManager();
      await networkManager.selectTab('Popular');
      await networkManager.selectNetworkByNameWithWait('Bitcoin');

      await test(driver, mockServer);
    },
  );
}
