/**
 * This test suite is for testing connecting to a dapp with different wallet providers (EVM and Solana).
 */
import { SolScope } from '@metamask/keyring-api';
import { connectToDapp, WINDOW_TITLES, withFixtures } from '../../helpers';
import {
  DAPP_HOST_ADDRESS,
  DEFAULT_FIXTURE_ACCOUNT as EVM_ADDRESS_ONE,
} from '../../constants';
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
  account1 as SOLANA_ADDRESS_ONE,
} from '../../flask/solana-wallet-standard/testHelpers';
import { Driver } from '../../webdriver/driver';
import NetworkPermissionSelectModal from '../../page-objects/pages/dialog/network-permission-select-modal';
import EditConnectedAccountsModal from '../../page-objects/pages/dialog/edit-connected-accounts-modal';

const EVM_ADDRESS_TWO = '0x09781764c08de8ca82e156bbf156a3ca217c7950';
const SOLANA_ACCOUNT_ONE = `${SolScope.Mainnet}:${SOLANA_ADDRESS_ONE}`;

const EVM_ACCOUNT_LABEL_ONE = 'Account 1';
const EVM_ACCOUNT_LABEL_TWO = 'Account 2';
const SOLANA_ACCOUNT_LABEL_ONE = 'Solana 1';

const SOLANA_PERMISSIONS = {
  isMultichainOrigin: true,
  sessionProperties: {},
  requiredScopes: {},
  optionalScopes: {
    [SolScope.Mainnet]: {
      accounts: [SOLANA_ACCOUNT_ONE],
    },
  },
};

/**
 * Helper to open a permissions page for a specific app hostname
 *
 * @param driver - The driver to use.
 * @param hostname - The hostname to get the permissions page for.
 * @returns The permissions page for the given host.
 */
async function getPermissionsPageForHost(
  driver: Driver,
  hostname: string,
): Promise<SitePermissionPage> {
  const homepage = new Homepage(driver);
  await homepage.headerNavbar.openPermissionsPage();
  const permissionListPage = new PermissionListPage(driver);
  await permissionListPage.check_pageIsLoaded();
  await permissionListPage.openPermissionPageForSite(hostname);
  const sitePermissionPage = new SitePermissionPage(driver);
  await sitePermissionPage.check_pageIsLoaded(hostname);
  return sitePermissionPage;
}
/**
 * Checks if an account is displayed
 *
 * @param driver - The test driver
 * @param account - The account to check
 */
async function checkIsAccountDisplayed(
  driver: Driver,
  account: string,
): Promise<void> {
  await driver.waitForSelector({
    text: account,
    tag: 'button',
  });
}

/**
 * Helper to check if the accounts and networks are displayed in the site permission page.
 *
 * @param driver - The test driver
 * @param sitePermissionPage - The site permission page to use.
 * @param networks - The networks to check.
 * @param accounts - The accounts to check.
 */
async function checkAccountsAndNetworksDisplayed(
  driver: Driver,
  sitePermissionPage: SitePermissionPage,
  networks: string[],
  accounts: string[],
) {
  await sitePermissionPage.check_pageIsLoaded(DAPP_HOST_ADDRESS);
  await sitePermissionPage.openNetworkPermissionsModal();
  const networkPermissionSelectModal = new NetworkPermissionSelectModal(driver);
  await networkPermissionSelectModal.check_pageIsLoaded();

  await networkPermissionSelectModal.check_networkStatus(networks);

  await networkPermissionSelectModal.clickConfirmEditButton();
  await sitePermissionPage.openAccountPermissionsModal();
  const accountPermissionSelectModal = new EditConnectedAccountsModal(driver);
  await accountPermissionSelectModal.check_pageIsLoaded();

  for (const account of accounts) {
    await checkIsAccountDisplayed(driver, account);
  }
}

/**
 * Helper to get a request permissions request object with a caveat.
 *
 * @param accounts - The accounts to be requested.
 * @returns The request permissions request object with the caveat.
 */
function getRequestPermissionsRequestObject(accounts: string[] = []): string {
  const caveats =
    accounts.length > 0
      ? {
          caveats: [
            {
              type: 'restrictReturnedAccounts',
              value: accounts,
            },
          ],
        }
      : {};

  return JSON.stringify({
    jsonrpc: '2.0',
    method: 'wallet_requestPermissions',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    params: [{ eth_accounts: caveats }],
  });
}

/**
 * Helper to get a request permissions request object with network restrictions.
 *
 * @param networks - Array of network IDs to restrict switching to
 * @returns the wallet_requestPermissions request string
 */
function getRestrictedNetworks(networks: string[]): string {
  const restrictNetworks = {
    'endowment:permitted-chains': {
      caveats: [
        {
          type: 'restrictNetworkSwitching',
          value: networks,
        },
      ],
    },
  };

  return JSON.stringify({
    jsonrpc: '2.0',
    method: 'wallet_requestPermissions',
    params: [restrictNetworks],
  });
}

describe('Multiple Standard Dapp Connections', function () {
  it('should default account selection to already permitted account(s) plus the selected account (if not already permissioned) when `wallet_requestPermissions` is called with no accounts specified', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withKeyringControllerAdditionalAccountVault()
          .withPreferencesControllerAdditionalAccountIdentities()
          .withAccountsControllerAdditionalAccountIdentities()
          .withPermissionControllerConnectedToTestDapp({
            account: EVM_ADDRESS_TWO,
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

        await testDapp.check_connectedAccounts(EVM_ADDRESS_TWO);

        const requestPermissionsWithoutAccounts =
          getRequestPermissionsRequestObject();

        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsWithoutAccounts})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await connectAccountConfirmation.check_pageIsLoaded();

        await checkIsAccountDisplayed(driver, EVM_ACCOUNT_LABEL_TWO);

        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_connectedAccounts(EVM_ADDRESS_TWO);
      },
    );
  });

  it('should default account selection to both accounts when `wallet_requestPermissions` is called with specific account while another is already connected', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withKeyringControllerAdditionalAccountVault()
          .withPreferencesControllerAdditionalAccountIdentities()
          .withAccountsControllerAdditionalAccountIdentities()
          .withPermissionControllerConnectedToTestDapp({
            account: EVM_ADDRESS_TWO,
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

        await testDapp.check_connectedAccounts(EVM_ADDRESS_TWO);

        const requestPermissionsWithAccount1 =
          getRequestPermissionsRequestObject([EVM_ADDRESS_ONE]);

        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsWithAccount1})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await connectAccountConfirmation.check_pageIsLoaded();

        await checkIsAccountDisplayed(driver, EVM_ACCOUNT_LABEL_ONE);

        await checkIsAccountDisplayed(driver, EVM_ACCOUNT_LABEL_TWO);

        await await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const expectedConnectedAccounts = `${EVM_ADDRESS_TWO.toLowerCase()},${EVM_ADDRESS_ONE.toLowerCase()}`;
        await testDapp.check_connectedAccounts(expectedConnectedAccounts);
      },
    );
  });

  it('should retain EVM permissions when connecting through the Solana Wallet Standard', async function () {
    await withSolanaAccountSnap(
      {
        ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        withFixtureBuilder: (builder) =>
          builder
            .withKeyringControllerAdditionalAccountVault()
            .withPreferencesControllerAdditionalAccountIdentities()
            .withAccountsControllerAdditionalAccountIdentities()
            .withPermissionControllerConnectedToTestDappWithTwoAccounts(),
      },
      async (driver) => {
        const testDapp = new TestDappSolana(driver);

        await testDapp.openTestDappPage();
        await testDapp.switchTo();

        await connectSolanaTestDapp(driver, testDapp);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const sitePermissionPage = await getPermissionsPageForHost(
          driver,
          DAPP_HOST_ADDRESS,
        );

        await sitePermissionPage.check_connectedAccountsNumber(3);
        await sitePermissionPage.check_connectedNetworksNumber(2);

        await checkAccountsAndNetworksDisplayed(
          driver,
          sitePermissionPage,
          ['Solana', 'Localhost 8545'],
          [
            EVM_ACCOUNT_LABEL_ONE,
            EVM_ACCOUNT_LABEL_TWO,
            SOLANA_ACCOUNT_LABEL_ONE,
          ],
        );
      },
    );
  });

  it('should retain Solana permissions when connecting through the EVM provider', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        withFixtureBuilder: (builder) =>
          builder.withPermissionControllerConnectedToMultichainTestDapp({
            // @ts-expect-error Type error is expected here since its being inferred as null
            value: SOLANA_PERMISSIONS,
          }),
      },
      async (driver) => {
        const testDapp = new TestDapp(driver);

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();

        await connectToDapp(driver);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const sitePermissionPage = await getPermissionsPageForHost(
          driver,
          DAPP_HOST_ADDRESS,
        );

        await sitePermissionPage.check_connectedAccountsNumber(2);
        await sitePermissionPage.check_connectedNetworksNumber(4);

        await checkAccountsAndNetworksDisplayed(
          driver,
          sitePermissionPage,
          ['Ethereum Mainnet', 'Linea Mainnet', 'Base Mainnet', 'Solana'],
          [EVM_ACCOUNT_LABEL_ONE, SOLANA_ACCOUNT_LABEL_ONE],
        );
      },
    );
  });

  it('should default account selection to already permissioned Solana account and requested Ethereum account when `wallet_requestPermissions` is called with specific Ethereum account', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        withFixtureBuilder: (builder) =>
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

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const requestPermissionsWithEthAccount2 =
          getRequestPermissionsRequestObject([EVM_ADDRESS_TWO]);

        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsWithEthAccount2})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );

        await connectAccountConfirmation.check_pageIsLoaded();

        await checkIsAccountDisplayed(driver, EVM_ACCOUNT_LABEL_TWO);

        await checkIsAccountDisplayed(driver, SOLANA_ACCOUNT_LABEL_ONE);

        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const sitePermissionPage = await getPermissionsPageForHost(
          driver,
          DAPP_HOST_ADDRESS,
        );

        await sitePermissionPage.check_connectedAccountsNumber(2);
        await sitePermissionPage.check_connectedNetworksNumber(4);

        await checkAccountsAndNetworksDisplayed(
          driver,
          sitePermissionPage,
          ['Ethereum Mainnet', 'Linea Mainnet', 'Base Mainnet', 'Solana'],
          [EVM_ACCOUNT_LABEL_TWO, SOLANA_ACCOUNT_LABEL_ONE],
        );
      },
    );
  });

  it('should be able to request specific chains when connecting through the EVM provider with existing permissions', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        withFixtureBuilder: (builder) =>
          builder.withPermissionControllerConnectedToMultichainTestDapp({
            // @ts-expect-error Type error is expected here since its being inferred as null
            value: SOLANA_PERMISSIONS,
          }),
      },
      async (driver) => {
        const testDapp = new TestDapp(driver);

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();

        const requestSpecificNetwork = getRestrictedNetworks(['0x1']);

        await driver.executeScript(
          `window.ethereum.request(${requestSpecificNetwork})`,
        );

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await connectAccountConfirmation.check_pageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const sitePermissionPage = await getPermissionsPageForHost(
          driver,
          DAPP_HOST_ADDRESS,
        );

        await sitePermissionPage.check_connectedAccountsNumber(2);
        await sitePermissionPage.check_connectedNetworksNumber(2);

        await checkAccountsAndNetworksDisplayed(
          driver,
          sitePermissionPage,
          ['Ethereum Mainnet', 'Solana'],
          [EVM_ACCOUNT_LABEL_ONE, SOLANA_ACCOUNT_LABEL_ONE],
        );
      },
    );
  });
});
