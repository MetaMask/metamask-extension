import assert from 'assert';
import { Suite } from 'mocha';

import {
  DAPP_HOST_ADDRESS,
  DAPP_PATH,
  SOLANA_MAINNET_SCOPE,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { Driver } from '../../webdriver/driver';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import Homepage from '../../page-objects/pages/home/homepage';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import { TestDappMmConnect as TestDapp } from '../../page-objects/pages/test-dapp-mm-connect';

// CAIP-2 EVM chain IDs used across tests
const EVM_CHAINS = {
  ETHEREUM: 'eip155:1',
  POLYGON: 'eip155:137',
  LINEA: 'eip155:59144',
} as const;

/**
 * Navigate to the permissions page for a specific host origin and return a
 * SitePermissionPage PO ready for assertions.
 *
 * Matches the helper used in multiple-provider-connections.spec.ts.
 */
async function getPermissionsPageForHost(
  driver: Driver,
  hostname: string,
): Promise<SitePermissionPage> {
  const homepage = new Homepage(driver);
  await homepage.headerNavbar.openPermissionsPage();
  const permissionListPage = new PermissionListPage(driver);
  await permissionListPage.checkPageIsLoaded();
  await permissionListPage.openPermissionPageForSite(hostname);
  const sitePermissionPage = new SitePermissionPage(driver);
  await sitePermissionPage.checkPageIsLoaded(hostname);
  return sitePermissionPage;
}

const MM_CONNECT_TEST_DAPP_OPTIONS = {
  customDappPaths: [DAPP_PATH.TEST_DAPP_MM_CONNECT],
};

describe('MM Connect — Multichain E2E', function (this: Suite) {
  it('connects to 3 EVM chains and Solana simultaneously and verifies all ScopeCards are active', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: MM_CONNECT_TEST_DAPP_OPTIONS,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openPage();

        // Include Solana in the multichain session request (not the
        // wallet-standard adapter — just the Connect (Multichain) button).
        await testDapp.selectNetworks([
          EVM_CHAINS.ETHEREUM,
          EVM_CHAINS.POLYGON,
          EVM_CHAINS.LINEA,
          SOLANA_MAINNET_SCOPE,
        ]);
        await testDapp.clickConnect();

        // Approve the wallet_createSession dialog in the extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new ConnectAccountConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.confirmConnect();

        // All 4 ScopeCards should now be visible (3 EVM + Solana Mainnet)
        await testDapp.switchTo();
        await testDapp.checkScopeCardVisible(EVM_CHAINS.ETHEREUM);
        await testDapp.checkScopeCardVisible(EVM_CHAINS.POLYGON);
        await testDapp.checkScopeCardVisible(EVM_CHAINS.LINEA);
        await testDapp.checkScopeCardVisible(SOLANA_MAINNET_SCOPE);
        await testDapp.checkConnectionStatus('connected');
      },
    );
  });

  it('routes personal_sign requests to the correct chain', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: MM_CONNECT_TEST_DAPP_OPTIONS,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openPage();

        // Connect to 3 EVM chains
        await testDapp.selectNetworks([
          EVM_CHAINS.ETHEREUM,
          EVM_CHAINS.POLYGON,
          EVM_CHAINS.LINEA,
        ]);
        await testDapp.clickConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new ConnectAccountConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.confirmConnect();

        await testDapp.switchTo();

        for (const chainId of [
          EVM_CHAINS.ETHEREUM,
          EVM_CHAINS.POLYGON,
          EVM_CHAINS.LINEA,
        ]) {
          // Fire the request without blocking on the result
          await testDapp.triggerMethod(chainId, 'personal_sign');

          // Handle the signing dialog in the extension.
          // clickElementAndWaitForWindowToClose prevents NoSuchWindowError by
          // waiting for the dialog window to close before returning, so the
          // driver is never left focused on a dead window handle.
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.waitForSelector('[data-testid="confirm-footer-button"]');
          await driver.clickElementAndWaitForWindowToClose(
            '[data-testid="confirm-footer-button"]',
          );

          // Back in test dapp: the result entry should now be visible
          await testDapp.switchTo();
          const result = await testDapp.getMethodResult(
            chainId,
            'personal_sign',
          );

          // A successful personal_sign result is an hex string, where errors are returned as objects.
          assert.ok(
            result.startsWith('"0x'),
            `Expected personal_sign result for ${chainId}, got: "${result}"`,
          );
        }
      },
    );
  });

  it('returns the correct eth_chainId response for each connected EVM chain', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: MM_CONNECT_TEST_DAPP_OPTIONS,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openPage();

        await testDapp.selectNetworks([
          EVM_CHAINS.ETHEREUM,
          EVM_CHAINS.POLYGON,
          EVM_CHAINS.LINEA,
        ]);
        await testDapp.clickConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new ConnectAccountConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.confirmConnect();

        await testDapp.switchTo();

        // eth_chainId must return the hex chain ID specific to each scope
        const expectedChainIds: [string, string][] = [
          [EVM_CHAINS.ETHEREUM, '0x1'],
          [EVM_CHAINS.POLYGON, '0x89'],
          [EVM_CHAINS.LINEA, '0xe708'],
        ];

        for (const [chainId, expectedHex] of expectedChainIds) {
          const result = await testDapp.invokeMethod(chainId, 'eth_chainId');
          assert.strictEqual(
            result,
            `"${expectedHex}"`,
            `Expected eth_chainId for ${chainId} to equal "${expectedHex}", got: "${result}"`,
          );
        }
      },
    );
  });

  it('reflects removed chain permission in the connected app', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: MM_CONNECT_TEST_DAPP_OPTIONS,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openPage();

        await testDapp.selectNetworks([
          EVM_CHAINS.ETHEREUM,
          EVM_CHAINS.POLYGON,
          EVM_CHAINS.LINEA,
        ]);
        await testDapp.clickConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new ConnectAccountConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.confirmConnect();

        // All 3 chains connected — verify
        await testDapp.switchTo();
        await testDapp.checkScopeCardVisible(EVM_CHAINS.ETHEREUM);
        await testDapp.checkScopeCardVisible(EVM_CHAINS.POLYGON);
        await testDapp.checkScopeCardVisible(EVM_CHAINS.LINEA);

        // Remove Polygon from permitted networks via the extension
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const sitePermissionPage = await getPermissionsPageForHost(
          driver,
          DAPP_HOST_ADDRESS,
        );
        // editPermissionsForNetwork toggles the named network off then confirms.
        await sitePermissionPage.editPermissionsForNetwork(['Polygon']);

        // Back in test dapp: Polygon ScopeCard should no longer be visible
        await testDapp.switchTo();
        await testDapp.checkScopeCardNotVisible(EVM_CHAINS.POLYGON);

        // Ethereum and Linea ScopeCards should still be present
        await testDapp.checkScopeCardVisible(EVM_CHAINS.ETHEREUM);
        await testDapp.checkScopeCardVisible(EVM_CHAINS.LINEA);
      },
    );
  });

  it('fully terminates the session on both dapp and wallet after wallet_revokeSession', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: MM_CONNECT_TEST_DAPP_OPTIONS,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openPage();

        await testDapp.selectNetworks([
          EVM_CHAINS.ETHEREUM,
          EVM_CHAINS.POLYGON,
          EVM_CHAINS.LINEA,
        ]);
        await testDapp.clickConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new ConnectAccountConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.confirmConnect();

        await testDapp.switchTo();
        await testDapp.checkConnectionStatus('connected');

        // Disconnect — this calls sdkDisconnect() → wallet_revokeSession
        await testDapp.clickDisconnect();

        // Dapp side: session scopes section disappears and the connect button
        // re-appears, confirming mm-connect's local session state is cleared.
        await testDapp.checkConnectionStatus('disconnected');

        // Wallet side: sdkDisconnect() is async-awaited and resolves only
        // after the extension has acknowledged wallet_revokeSession. If
        // checkConnectionStatus('disconnected') passes, both sides agree the
        // session is terminated — mm-connect will not mark itself disconnected
        // unless the wallet replied with a successful revocation response.
      },
    );
  });
});
