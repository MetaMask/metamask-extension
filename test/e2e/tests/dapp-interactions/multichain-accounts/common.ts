import { Driver } from '../../../webdriver/driver';
import { Mockttp } from 'mockttp';
import { strict as assert } from 'assert';

import {
  mockGetMinimumBalanceForRentExemption,
  mockMultiCoinPrice,
  mockGetLatestBlockhash,
  mockGetFeeForMessage,
  mockPriceApiSpotPrice,
  mockPriceApiExchangeRates,
  mockClientSideDetectionApi,
  mockPhishingDetectionApi,
  mockGetTokenAccountInfo,
  mockTokenApiMainnetTest,
  mockAccountsApi,
  mockGetMultipleAccounts,
  mockGetAccountInfoDevnet,
} from '../../solana/common-solana';
import FixtureBuilder from '../../../fixture-builder';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getExpectedSessionScope,
} from '../../../flask/multichain-api/testHelpers';
import {
  DAPP_HOST_ADDRESS,
  largeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { mockMultichainAccountsFeatureFlagStateTwo } from '../../multichain-accounts/common';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import { SECOND_TEST_E2E_SRP } from '../../../flask/multi-srp/common-multi-srp';
import HomePage from '../../../page-objects/pages/home/homepage';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import PermissionListPage from '../../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../../page-objects/pages/permission/site-permission-page';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';

export const SECOND_MULTICHAIN_ACCOUNT_IN_SECOND_TEST_E2E = {
  evm: '0x695d565c9dbcddd65845162423bc2ad3700081ff',
  solana: 'F8pbstnRPodSx5S8RA4Bn4hcwSZmt2MGdMCLfTx3HKDm',
};

const solanaMocks = async (mockServer: Mockttp) => {
  await mockGetMinimumBalanceForRentExemption(mockServer);
  await mockMultiCoinPrice(mockServer);
  await mockGetLatestBlockhash(mockServer);
  await mockGetFeeForMessage(mockServer);
  await mockPriceApiSpotPrice(mockServer);
  await mockPriceApiExchangeRates(mockServer);
  await mockClientSideDetectionApi(mockServer);
  await mockPhishingDetectionApi(mockServer);
  await mockGetTokenAccountInfo(mockServer);
  await mockTokenApiMainnetTest(mockServer);
  await mockAccountsApi(mockServer);
  await mockGetMultipleAccounts(mockServer);
  await mockGetAccountInfoDevnet(mockServer);
};

export const withMultichainAccountsAndDappConnectionFixture = async (
  {
    title,
    withMultichainDapp = true,
  }: {
    title?: string;
    withMultichainDapp?: boolean;
  },
  test: (driver: Driver, extensionId: string) => Promise<void>,
) => {
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToMultichainTestDappWithTwoAccounts({
          scopes: [],
        })
        .build(),
      title,
      testSpecificMock: async (mockServer: Mockttp) => {
        await solanaMocks(mockServer);
        await mockMultichainAccountsFeatureFlagStateTwo(mockServer);
      },
      ...(withMultichainDapp
        ? {
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
            dapp: true,
          }
        : {
            dapp: true,
          }),
    },
    async ({ driver, extensionId }) => {
      await loginWithoutBalanceValidation(driver);

      // Creating a new wallet to trigger the creation of the solana account in the second multichain account.
      const headerBarNavbar = new HeaderNavbar(driver);
      await headerBarNavbar.checkPageIsLoaded();
      await driver.clickElement('[data-testid="account-menu-icon"]');
      await driver.clickElement('[data-testid="add-wallet-button"]');
      await driver.clickElement('[data-testid="import-wallet-button"]');
      await driver.pasteIntoField(
        '#import-srp__multi-srp__srp-word-0',
        SECOND_TEST_E2E_SRP,
      );
      await driver.clickElement({
        text: 'Import wallet',
        tag: 'button',
      });

      const homepage = new HomePage(driver);
      await homepage.checkPageIsLoaded();

      await test(driver, extensionId);
    },
  );
};

export function validateSessionScopes(
  sessionResult: any,
  multichainAccount: {
    evm: string;
    solana: string;
  },
  evmScopes: string[] = EXPECTED_EVM_SCOPES,
  nonEvmScopes: string[] = EXPECTED_NON_EVM_SCOPES,
) {
  const expectedNewEvmSessionScopes = evmScopes.map((scope: string) => ({
    [scope]: getExpectedSessionScope(scope, [
      multichainAccount.evm.toLowerCase(),
    ]),
  }));

  const expectedSolanaSessionScopes = nonEvmScopes.map((scope: string) => {
    return {
      [scope]: {
        accounts: [`${scope}:${multichainAccount.solana}`],
        methods:
          scope !== 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z' // regnet is missing some methods
            ? [
                'signAndSendTransaction',
                'signTransaction',
                'signMessage',
                'signIn',
                'getGenesisHash',
                'getLatestBlockhash',
                'getMinimumBalanceForRentExemption',
              ]
            : [
                'signAndSendTransaction',
                'signTransaction',
                'signMessage',
                'signIn',
              ],
        notifications: [],
      },
    };
  });

  for (const expectedSessionScope of [
    ...expectedNewEvmSessionScopes,
    ...expectedSolanaSessionScopes,
  ]) {
    const [scopeName] = Object.keys(expectedSessionScope);
    const expectedScopeObject = expectedSessionScope[scopeName];
    const resultSessionScope = sessionResult.sessionScopes[scopeName];

    assert.deepEqual(
      expectedScopeObject,
      resultSessionScope,
      `${scopeName} does not match expected scope`,
    );
  }
}

export async function connectToMultichainTestDapp(
  driver: Driver,
  extensionId: string,
  multichainAccount: {
    evm: string;
    solana: string;
  } = SECOND_MULTICHAIN_ACCOUNT_IN_SECOND_TEST_E2E,
  checkPermissions = true,
) {
  const testDapp = new TestDappMultichain(driver);
  await testDapp.openTestDappPage();
  await testDapp.checkPageIsLoaded();
  await testDapp.connectExternallyConnectable(extensionId);

  await driver.clickElement('[data-testid="network-checkbox-eip155-1"]');
  await driver.clickElement(
    '[data-testid="network-checkbox-solana-5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"]',
  );

  await testDapp.clickWalletCreateSessionButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(largeDelayMs);

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
  await testDapp.checkPageIsLoaded();

  if (checkPermissions) {
    const newgetSessionResult = await testDapp.getSession();
    validateSessionScopes(newgetSessionResult, multichainAccount);
  }
}

export async function checkPermissions(
  driver: Driver,
  numberOfNetworks: number,
) {
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
  await sitePermissionPage.checkConnectedNetworksNumber(numberOfNetworks);
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
