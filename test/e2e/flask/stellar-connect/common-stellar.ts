import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import Homepage from '../../page-objects/pages/home/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { DAPP_PATH } from '../../constants';
import { mockStellarApis } from '../../tests/stellar/mocks/common-stellar';

// Ensure bundled test dapp supports Stellar testnet network-change E2E coverage.
import './patch-stellar-test-dapp';

export const withStellarAccountSnap = async (
  {
    title,
    numberOfAccounts = 1,
    dappOptions,
  }: {
    title?: string;
    numberOfAccounts?: number;
    dappOptions?: {
      numberOfTestDapps?: number;
      customDappPaths?: string[];
    };
  },
  test: (driver: Driver) => Promise<void>,
) => {
  await withFixtures(
    {
      forceBip44Version: false,
      fixtures: new FixtureBuilderV2()
        .withEnabledNetworks({
          stellar: {
            [MultichainNetworks.STELLAR]: true,
            [MultichainNetworks.STELLAR_TESTNET]: true,
          },
          eip155: {
            '0x539': true,
          },
        })
        .build(),
      title,
      dapp: true,
      dappOptions: dappOptions ?? {
        numberOfTestDapps: 1,
        customDappPaths: [DAPP_PATH.TEST_DAPP_STELLAR],
      },
      testSpecificMock: (mockServer: Mockttp) => mockStellarApis(mockServer),
    },
    async ({ driver }: { driver: Driver }) => {
      await login(driver);

      const accountListPage = new AccountListPage(driver);
      const homepage = new Homepage(driver);
      await homepage.checkExpectedBalanceIsDisplayed();

      for (let i = 0; i < numberOfAccounts; i++) {
        if (i === 0) {
          await homepage.headerNavbar.openAccountMenu();
        }

        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
      }

      await accountListPage.selectAccount('Account 1');

      await test(driver);
    },
  );
};
