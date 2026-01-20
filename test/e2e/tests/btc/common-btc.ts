import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import NetworkManager from '../../page-objects/pages/network-manager';
import {
  mockBitcoinFeatureFlag,
  mockExchangeRates,
  mockInitialFullScan,
  mockRampsDynamicFeatureFlag,
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

export async function withBtcAccountSnap(
  test: (driver: Driver, mockServer: Mockttp) => Promise<void>,
  title?: string,
) {
  await withFixtures(
    {
      // Use onboarding flow to trigger fullScan (not sync)
      onboarding: true,
      title,
      dappOptions: { numberOfTestDapps: 1 },
      manifestFlags: {
        remoteFeatureFlags: {
          enableMultichainAccountsState2: {
            enabled: true,
            featureVersion: '2',
            minimumVersion: '12.19.0',
          },
          bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
          sendRedesign: { enabled: true },
        },
      },
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockBitcoinFeatureFlag(mockServer),
        await mockInitialFullScan(mockServer),
        await mockExchangeRates(mockServer),

        // See: PROD_RAMP_API_BASE_URL
        await mockRampsDynamicFeatureFlag(mockServer, 'api'),
        // See: UAT_RAMP_API_BASE_URL
        await mockRampsDynamicFeatureFlag(mockServer, 'uat-api'),
        await mockPriceMulti(mockServer),
        await mockPriceMultiBtcAndSol(mockServer),
      ],
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      // Complete onboarding - this triggers fullScan for Bitcoin snap
      await completeImportSRPOnboardingFlow({ driver });

      // Wait for fullScan to complete
      await driver.delay(5000);

      // Switch to Bitcoin network
      const networkManager = new NetworkManager(driver);
      await networkManager.openNetworkManager();
      await networkManager.selectTab('Popular');
      await networkManager.selectNetworkByNameWithWait('Bitcoin');

      await test(driver, mockServer);
    },
  );
}
