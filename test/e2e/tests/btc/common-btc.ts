import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import NetworkManager from '../../page-objects/pages/network-manager';
import {
  mockExchangeRates,
  mockInitialFullScan,
  mockRampsDynamicFeatureFlag,
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';
import { mockBitcoinFeatureFlag } from './mocks/feature-flag';

export async function mockBtcApis(mockServer: Mockttp) {
  return [
    await mockBitcoinFeatureFlag(mockServer),
    await mockInitialFullScan(mockServer),
    await mockExchangeRates(mockServer),
    // Ramps API mocks
    await mockRampsDynamicFeatureFlag(mockServer, 'api'),
    await mockRampsDynamicFeatureFlag(mockServer, 'uat-api'),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
  ];
}

export async function withBtcAccountSnap(
  test: (driver: Driver, mockServer: Mockttp) => Promise<void>,
  title?: string,
) {
  await withFixtures(
    {
      forceBip44Version: false,
      fixtures: new FixtureBuilder()
        .withEnabledNetworks({
          eip155: {
            '0x539': true,
          },
          bip122: {
            [MultichainNetworks.BITCOIN]: true,
          },
        })
        .build(),
      title,
      dappOptions: { numberOfTestDapps: 1 },
      testSpecificMock: mockBtcApis,
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      await loginWithBalanceValidation(driver);

      // Switch to Bitcoin network
      const networkManager = new NetworkManager(driver);
      await networkManager.openNetworkManager();
      await networkManager.selectTab('Popular');
      await networkManager.selectNetworkByNameWithWait('Bitcoin');

      await test(driver, mockServer);
    },
  );
}
