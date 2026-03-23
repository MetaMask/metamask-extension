import { Suite } from 'mocha';

import {
  DAPP_HOST_ADDRESS,
  DAPP_PATH,
  MM_CONNECT_EVM_CHAINS,
  SOLANA_MAINNET_SCOPE,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { getPermissionsPageForHost } from '../../page-objects/flows/permissions.flow';
import { Driver } from '../../webdriver/driver';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import SnapSignMessageConfirmation from '../../page-objects/pages/confirmations/snap-sign-message-confirmation';
import { TestDappMmConnect as TestDapp } from '../../page-objects/pages/test-dapp-mm-connect';

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
        await login(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const testDapp = new TestDapp(driver);
        await testDapp.openPage();

        // Include Solana in the multichain session request (not the
        // wallet-standard adapter — just the Connect (Multichain) button).
        await testDapp.selectNetworks([
          MM_CONNECT_EVM_CHAINS.ETHEREUM,
          MM_CONNECT_EVM_CHAINS.POLYGON,
          MM_CONNECT_EVM_CHAINS.LINEA,
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
        await testDapp.checkScopeCardVisible(MM_CONNECT_EVM_CHAINS.ETHEREUM);
        await testDapp.checkScopeCardVisible(MM_CONNECT_EVM_CHAINS.POLYGON);
        await testDapp.checkScopeCardVisible(MM_CONNECT_EVM_CHAINS.LINEA);
        await testDapp.checkScopeCardVisible(SOLANA_MAINNET_SCOPE);
        await testDapp.checkConnectionStatus('connected');
      },
    );
  });

  it('routes personal_sign requests to the correct chain and handles Solana signMessage', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: MM_CONNECT_TEST_DAPP_OPTIONS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openPage();

        // Connect to 3 EVM chains + Solana
        await testDapp.selectNetworks([
          MM_CONNECT_EVM_CHAINS.ETHEREUM,
          MM_CONNECT_EVM_CHAINS.POLYGON,
          MM_CONNECT_EVM_CHAINS.LINEA,
          SOLANA_MAINNET_SCOPE,
        ]);
        await testDapp.clickConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new ConnectAccountConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.confirmConnect();

        await testDapp.switchTo();

        for (const chainId of Object.values(MM_CONNECT_EVM_CHAINS)) {
          // Fire the request without blocking on the result
          await testDapp.triggerMethod(chainId, 'personal_sign');

          // Handle the signing dialog in the extension.
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const signingConfirmation = new Confirmation(driver);
          await signingConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

          // Back in test dapp: validate result is a hex signature string
          await testDapp.switchTo();
          await testDapp.checkMethodResult(chainId, 'personal_sign', '"0x');
        }

        // Trigger signMessage for Solana
        await testDapp.triggerMethod(SOLANA_MAINNET_SCOPE, 'signMessage');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const solanaSigningConfirmation = new SnapSignMessageConfirmation(
          driver,
        );
        await solanaSigningConfirmation.checkPageIsLoaded();
        await solanaSigningConfirmation.clickFooterConfirmButton();

        await testDapp.switchTo();
        await testDapp.checkSolanaSignMessageResult(SOLANA_MAINNET_SCOPE);
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
        await login(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openPage();

        await testDapp.selectNetworks(Object.values(MM_CONNECT_EVM_CHAINS));
        await testDapp.clickConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new ConnectAccountConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.confirmConnect();

        await testDapp.switchTo();

        // eth_chainId must return the hex chain ID specific to each scope
        const expectedChainIds: [string, string][] = [
          [MM_CONNECT_EVM_CHAINS.ETHEREUM, '0x1'],
          [MM_CONNECT_EVM_CHAINS.POLYGON, '0x89'],
          [MM_CONNECT_EVM_CHAINS.LINEA, '0xe708'],
        ];

        for (const [chainId, expectedHex] of expectedChainIds) {
          await testDapp.triggerMethod(chainId, 'eth_chainId');
          await testDapp.checkMethodResult(
            chainId,
            'eth_chainId',
            `"${expectedHex}"`,
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
        await login(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openPage();

        await testDapp.selectNetworks(Object.values(MM_CONNECT_EVM_CHAINS));
        await testDapp.clickConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new ConnectAccountConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.confirmConnect();

        // All 3 chains connected — verify
        await testDapp.switchTo();
        await testDapp.checkScopeCardVisible(MM_CONNECT_EVM_CHAINS.ETHEREUM);
        await testDapp.checkScopeCardVisible(MM_CONNECT_EVM_CHAINS.POLYGON);
        await testDapp.checkScopeCardVisible(MM_CONNECT_EVM_CHAINS.LINEA);

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
        await testDapp.checkScopeCardNotVisible(MM_CONNECT_EVM_CHAINS.POLYGON);

        // Ethereum and Linea ScopeCards should still be present
        await testDapp.checkScopeCardVisible(MM_CONNECT_EVM_CHAINS.ETHEREUM);
        await testDapp.checkScopeCardVisible(MM_CONNECT_EVM_CHAINS.LINEA);
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
        await login(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openPage();

        await testDapp.selectNetworks(Object.values(MM_CONNECT_EVM_CHAINS));
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
