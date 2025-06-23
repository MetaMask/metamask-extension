import { connectToDapp, WINDOW_TITLES, withFixtures } from '../../helpers';
import { DAPP_HOST_ADDRESS, DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import Homepage from '../../page-objects/pages/home/homepage';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { withSolanaAccountSnap } from '../solana/common-solana';
import FixtureBuilder from '../../fixture-builder';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import {
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from '../../flask/solana-wallet-standard/testHelpers';

const SOLANA_CAIP_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOLANA_FIRST_ACCOUNT = `${SOLANA_CAIP_CHAIN_ID}:4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer`;

const SOLANA_PERMISSIONS = {
  requiredScopes: {},
  optionalScopes: {
    [SOLANA_CAIP_CHAIN_ID]: {
      accounts: [SOLANA_FIRST_ACCOUNT],
    },
  },
  isMultichainOrigin: true,
};

const EVM_SECOND_ACCOUNT = '0x09781764c08de8ca82e156bbf156a3ca217c7950';

describe('Multiple Standard Dapp Connections', function () {
  it('should default to existing permitted account when wallet_requestPermissions is called again with no accounts specified', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withKeyringControllerAdditionalAccountVault()
          .withPreferencesControllerAdditionalAccountIdentities()
          .withAccountsControllerAdditionalAccountIdentities()
          .withPermissionControllerConnectedToTestDapp({
            account: EVM_SECOND_ACCOUNT,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();

        await testDapp.check_connectedAccounts(EVM_SECOND_ACCOUNT);

        const requestPermissionsWithoutAccounts = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });

        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsWithoutAccounts})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await connectAccountConfirmation.check_pageIsLoaded();
        await connectAccountConfirmation.check_isAccountDisplayed(
          EVM_SECOND_ACCOUNT.toUpperCase(),
        );

        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_connectedAccounts(EVM_SECOND_ACCOUNT);
      },
    );
  });

  it('should show both accounts when wallet_requestPermissions is called with specific account while another is already connected', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withKeyringControllerAdditionalAccountVault()
          .withPreferencesControllerAdditionalAccountIdentities()
          .withAccountsControllerAdditionalAccountIdentities()
          .withPermissionControllerConnectedToTestDapp({
            account: EVM_SECOND_ACCOUNT,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();

        await testDapp.check_connectedAccounts(EVM_SECOND_ACCOUNT);

        const requestPermissionsWithAccount1 = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_requestPermissions',
          params: [
            {
              eth_accounts: {
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: [DEFAULT_FIXTURE_ACCOUNT],
                  },
                ],
              },
            },
          ],
        });

        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsWithAccount1})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await connectAccountConfirmation.check_pageIsLoaded();

        await driver.waitForSelector({
          text: '0x5CfE7...6a7e1',
          tag: 'p',
        });

        await connectAccountConfirmation.check_isAccountDisplayed(
          EVM_SECOND_ACCOUNT.toUpperCase(),
        );

        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const expectedConnectedAccounts = `${EVM_SECOND_ACCOUNT.toLowerCase()},${DEFAULT_FIXTURE_ACCOUNT.toLowerCase()}`;
        await testDapp.check_connectedAccounts(expectedConnectedAccounts);
      },
    );
  });

  it('should retain EVM permissions when connecting through the Solana Wallet Standard', async function () {
    await withSolanaAccountSnap(
      {
        ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        fixtureModifications: (builder) =>
          builder
            .withKeyringControllerAdditionalAccountVault()
            .withPreferencesControllerAdditionalAccountIdentities()
            .withAccountsControllerAdditionalAccountIdentities()
            .withPermissionControllerConnectedToTestDappWithTwoAccounts(),
      },
      async (driver) => {
        const testDapp = new TestDappSolana(driver);
        const homepage = new Homepage(driver);

        await testDapp.openTestDappPage();
        await testDapp.switchTo();

        await connectSolanaTestDapp(driver, testDapp);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homepage.headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.check_pageIsLoaded(DAPP_HOST_ADDRESS);

        await sitePermissionPage.check_connectedAccountsNumber(3);
        await sitePermissionPage.check_connectedNetworksNumber(2);
      },
    );
  });

  it('should retain Solana permissions when connecting through the EVM provider', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        fixtureModifications: (builder) =>
          builder.withPermissionControllerConnectedToMultichainTestDapp({
            // @ts-expect-error Type error is expected here since its being inferred as null
            value: SOLANA_PERMISSIONS,
          }),
      },
      async (driver) => {
        const testDapp = new TestDapp(driver);
        const homepage = new Homepage(driver);

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();
        await testDapp.clickConnectAccountButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await connectToDapp(driver);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homepage.headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.check_pageIsLoaded(DAPP_HOST_ADDRESS);

        await sitePermissionPage.check_connectedAccountsNumber(2);
        await sitePermissionPage.check_connectedNetworksNumber(4);
      },
    );
  });

  it('should show Solana account and requested Ethereum account when wallet_requestPermissions is called with specific Ethereum account', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        fixtureModifications: (builder) =>
          builder
            .withKeyringControllerAdditionalAccountVault()
            .withPreferencesControllerAdditionalAccountIdentities()
            .withAccountsControllerAdditionalAccountIdentities()
            .withPermissionControllerConnectedToMultichainTestDapp({
              // @ts-expect-error Type error is expected here since its being inferred as null
              value: SOLANA_PERMISSIONS,
            }),
      },
      async (driver) => {
        const testDapp = new TestDapp(driver);
        const homepage = new Homepage(driver);

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const requestPermissionsWithEthAccount4 = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_requestPermissions',
          params: [
            {
              eth_accounts: {
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: [EVM_SECOND_ACCOUNT],
                  },
                ],
              },
            },
          ],
        });

        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsWithEthAccount4})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );

        await connectAccountConfirmation.check_pageIsLoaded();

        await connectAccountConfirmation.check_isAccountDisplayed(
          EVM_SECOND_ACCOUNT.toUpperCase(),
        );

        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homepage.headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.check_pageIsLoaded(DAPP_HOST_ADDRESS);

        await sitePermissionPage.check_connectedAccountsNumber(2);
        await sitePermissionPage.check_connectedNetworksNumber(4);
      },
    );
  });
});
