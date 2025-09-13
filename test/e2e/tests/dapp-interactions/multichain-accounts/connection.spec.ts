import { Suite } from 'mocha';
import { WINDOW_TITLES, withFixtures } from '../../../helpers';
import { DAPP_HOST_ADDRESS, DEFAULT_FIXTURE_ACCOUNT } from '../../../constants';
import { strict as assert } from 'assert';
import { getExpectedSessionScope } from '../../../flask/multichain-api/testHelpers';
import HomePage from '../../../page-objects/pages/home/homepage';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import PermissionListPage from '../../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../../page-objects/pages/permission/site-permission-page';
import { Driver, PAGES } from '../../../webdriver/driver';
import { withMultichainAccountsAndDappConnection } from './common';
import TestDapp from '../../../page-objects/pages/test-dapp';

// TODO: find a way to get default number of chains that a client has.
const DEFAULT_EVM_NETWORKS = ['eip155:1', 'eip155:59144', 'eip155:8453']; // mainnet, linea, base
const DEFAULT_TESTNET_EVM_NETWORKS = [
  'eip155:11155111',
  'eip155:59141',
  'eip155:1337',
  'eip155:6342',
  'eip155:10143',
]; // sepolia, linea sepolia, localhost, megatestnet, monad testnet

const EXPECTED_SCOPES = [
  ...DEFAULT_EVM_NETWORKS,
  ...DEFAULT_TESTNET_EVM_NETWORKS,
];
const DEFAULT_NUMBER_OF_NETWORKS = EXPECTED_SCOPES.length;

export async function connectToMultichainTestDapp(
  driver: Driver,
  extensionId: string,
) {
  const testDapp = new TestDappMultichain(driver);
  await testDapp.openTestDappPage();
  await testDapp.checkPageIsLoaded();
  await testDapp.connectExternallyConnectable(extensionId);

  // Requesting only for mainnet
  await testDapp.initCreateSessionScopes(
    ['eip155:1'],
    [`eip155:1:${DEFAULT_FIXTURE_ACCOUNT.toLowerCase()}`],
  );

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  const newgetSessionResult = await testDapp.getSession();

  const expectedNewSessionScopes = EXPECTED_SCOPES.map((scope: string) => ({
    [scope]: getExpectedSessionScope(scope, [
      DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
    ]),
  }));

  for (const expectedSessionScope of expectedNewSessionScopes) {
    const [scopeName] = Object.keys(expectedSessionScope);
    const expectedScopeObject = expectedSessionScope[scopeName];
    const resultSessionScope = newgetSessionResult.sessionScopes[scopeName];

    assert.deepEqual(
      expectedScopeObject,
      resultSessionScope,
      `${scopeName} does not match expected scope`,
    );
  }
}

export async function connectToTestDapp(driver: Driver) {
  const testDapp = new TestDapp(driver);
  await testDapp.openTestDappPage();
  await testDapp.checkPageIsLoaded();
  await testDapp.connectAccount({
    publicAddress: DEFAULT_FIXTURE_ACCOUNT,
  });
  await testDapp.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);
}

export async function signPersonalSignOnTestDapp(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  const testDapp = new TestDapp(driver);
  await testDapp.personalSign();
  await testDapp.checkSuccessPersonalSign(DEFAULT_FIXTURE_ACCOUNT);
}

export async function checkPermissions(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();

  // change to main wallet view and check permissions
  // open permissions page and check that the dapp is connected
  await new HeaderNavbar(driver).openPermissionsPage();
  const permissionListPage = new PermissionListPage(driver);
  await permissionListPage.checkPageIsLoaded();
  await permissionListPage.checkConnectedToSite(DAPP_HOST_ADDRESS);
  await permissionListPage.checkNumberOfConnectedSites(1);
  await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
  const sitePermissionPage = new SitePermissionPage(driver);
  await sitePermissionPage.checkPageIsLoaded(DAPP_HOST_ADDRESS);

  // All chains should be connected.
  await sitePermissionPage.checkConnectedNetworksNumber(
    DEFAULT_NUMBER_OF_NETWORKS,
  );
}

export async function removePermissions(
  driver: Driver,
  chainsToDisconnect: string[],
) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  const homepage = new HomePage(driver);
  await homepage.checkPageIsLoaded();
  await homepage.headerNavbar.openPermissionsPage();
  const permissionListPage = new PermissionListPage(driver);
  await permissionListPage.checkPageIsLoaded();
  await permissionListPage.checkConnectedToSite(DAPP_HOST_ADDRESS);
  await permissionListPage.checkNumberOfConnectedSites(1);
  await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
  const sitePermissionPage = new SitePermissionPage(driver);
  await sitePermissionPage.checkPageIsLoaded(DAPP_HOST_ADDRESS);
  await sitePermissionPage.openNetworkPermissionsModal();
  for (const chainToDisconnect of chainsToDisconnect) {
    await sitePermissionPage.uncheckNetwork(chainToDisconnect);
  }
  await sitePermissionPage.clickConfirmEditNetworksButton();
}

describe('Bip 44 Permissions', function (this: Suite) {
  it('grants all default chain permissions when connecting', async function () {
    await withMultichainAccountsAndDappConnection(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver, extensionId: string) => {
        await connectToMultichainTestDapp(driver, extensionId);
        await checkPermissions(driver);
      },
    );
  });

  it('connects to evm provider with bip44 accounts and is able to sign', async function () {
    await withMultichainAccountsAndDappConnection(
      {
        title: this.test?.fullTitle(),
        withMultichainDapp: false,
      },
      async (driver: Driver) => {
        // Should be able to connect to dapps with the ethereum provider and sign personal sign
        await connectToTestDapp(driver);
        await checkPermissions(driver);
        await signPersonalSignOnTestDapp(driver);
      },
    );
  });

  it('connects to nonevm provider and is able to sign', async function () {
    await withMultichainAccountsAndDappConnection(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver) => {
        // TODO: implement when account provider auto creates solana account
      },
    );
  });

  it.only('is able to remove permissions', async function () {
    await withMultichainAccountsAndDappConnection(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver, extensionId: string) => {
        await connectToMultichainTestDapp(driver, extensionId);
        await checkPermissions(driver);

        await driver.navigate(PAGES.HOME);

        await removePermissions(driver, ['eip155:1']);

        // Go back to test dapp and get scopes
        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
        const testDapp = new TestDappMultichain(driver);
        await testDapp.checkPageIsLoaded();
        const newgetSessionResult = await testDapp.getSession();

        const expectedNewScopes = EXPECTED_SCOPES.filter(
          (scope: string) => scope !== 'eip155:1',
        );
        const expectedNewSessionScopes = expectedNewScopes.map(
          (scope: string) => ({
            [scope]: getExpectedSessionScope(scope, [
              DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
            ]),
          }),
        );
        // Compare scopes in an order-independent way
        for (const expectedSessionScope of expectedNewSessionScopes) {
          const [scopeName] = Object.keys(expectedSessionScope);
          const expectedScopeObject = expectedSessionScope[scopeName];
          const resultSessionScope =
            newgetSessionResult.sessionScopes[scopeName];

          assert.deepEqual(
            expectedScopeObject,
            resultSessionScope,
            `${scopeName} does not match expected scope`,
          );
        }
      },
    );
  });
});
