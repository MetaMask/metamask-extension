import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { ACCOUNT_TYPE } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import FixtureBuilder from '../../fixture-builder';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
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
      dapp: true,
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
      await loginWithBalanceValidation(driver);
      // create one BTC account
      await new HeaderNavbar(driver).openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.check_pageIsLoaded();
      await accountListPage.addAccount({ accountType: ACCOUNT_TYPE.Bitcoin });
      await test(driver, mockServer);
    },
  );
}
