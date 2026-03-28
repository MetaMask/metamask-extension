import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import MultichainAccountDetailsPage from '../../page-objects/pages/multichain/multichain-account-details-page';
import { mockTronApis, TRON_ACCOUNT_ADDRESS } from './mocks/common-tron';

describe('Tron account creation', function (this: Suite) {
  it('Creates a Tron account and verifies it appears in the account list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockTronApis(mockServer, true),
        manifestFlags: {
          remoteFeatureFlags: {
            tronAccounts: { enabled: true, minimumVersion: '13.6.0' },
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
        await accountListPage.checkAccountDisplayedInAccountList('Tron 1');
      },
    );
  });

  it('Verifies the exact base58 address derived from the test SRP', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockTronApis(mockServer, true),
        manifestFlags: {
          remoteFeatureFlags: {
            tronAccounts: { enabled: true, minimumVersion: '13.6.0' },
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // Navigate to the Tron network so the Tron account is active
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountDetailsModalDetailsTab();

        const accountDetailsPage = new MultichainAccountDetailsPage(driver);
        await accountDetailsPage.checkPageIsLoaded();

        const actualAddress = await accountDetailsPage.getAccountAddress();
        assert.equal(
          actualAddress,
          TRON_ACCOUNT_ADDRESS,
          `Expected Tron address "${TRON_ACCOUNT_ADDRESS}" but got "${actualAddress}"`,
        );
      },
    );
  });

  it('Shows zero balance for a newly created Tron account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockTronApis(mockServer, true),
        manifestFlags: {
          remoteFeatureFlags: {
            tronAccounts: { enabled: true, minimumVersion: '13.6.0' },
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '0 TRX' });
      },
    );
  });
});
