import assert from 'assert';
import { Suite } from 'mocha';

import {
  ACCOUNT_2,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  DAPP_PATH,
  DAPP_URL,
  WINDOW_TITLES,
} from '../../constants';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { Driver, PAGES } from '../../webdriver/driver';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import EditConnectedAccountsModal from '../../page-objects/pages/dialog/edit-connected-accounts-modal';
import NetworkPermissionSelectModal from '../../page-objects/pages/dialog/network-permission-select-modal';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { TestDappMmConnect as TestDapp } from '../../page-objects/pages/test-dapp-mm-connect';

const OPTIMISM_CHAIN_ID = parseInt(CHAIN_IDS.OPTIMISM, 16);

// ── Shared fixture options ─────────────────────────────────────────────────

const MM_CONNECT_TEST_DAPP_OPTIONS = {
  customDappPaths: [DAPP_PATH.TEST_DAPP_MM_CONNECT],
};

// ── Shared helpers ─────────────────────────────────────────────────────────

/**
 * Approve the MetaMask connect dialog after the dapp has initiated a
 * connection. Switches to the dialog, optionally adds extra accounts and
 * extra permitted networks, then confirms. The caller is responsible for
 * triggering the connect action on the dapp and for switching focus back
 * to it afterwards.
 *
 * @param driver - Selenium driver
 * @param options - Options object with totalAccounts and extraNetworks
 * @param options.totalAccounts - Total number of accounts to connect (default: 1)
 * @param options.extraNetworks - Additional network display names to permit (e.g. ['Polygon'])
 */
async function approveConnect(
  driver: Driver,
  {
    totalAccounts = 1,
    extraNetworks = [],
  }: { totalAccounts?: number; extraNetworks?: string[] } = {},
): Promise<void> {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const confirmation = new ConnectAccountConfirmation(driver);
  await confirmation.checkPageIsLoaded();

  if (totalAccounts > 1) {
    await confirmation.openEditAccountsModal();
    const editAccountsModal = new EditConnectedAccountsModal(driver);
    await editAccountsModal.checkPageIsLoaded();
    for (let i = 1; i < totalAccounts; i++) {
      await editAccountsModal.addNewAccount();
    }
  }

  if (extraNetworks.length > 0) {
    await confirmation.goToPermissionsTab();
    await confirmation.openEditNetworksModal();
    const networkModal = new NetworkPermissionSelectModal(driver);
    await networkModal.checkPageIsLoaded();
    for (const networkName of extraNetworks) {
      await networkModal.selectNetwork({ networkName, shouldBeSelected: true });
    }
    await networkModal.clickConfirmEditButton();
    await confirmation.checkPageIsLoaded();
  }

  await confirmation.confirmConnect();
}

/**
 * Open the MetaMask popup with the mm-connect dapp as the active tab origin,
 * then use the per-dapp connection menu to switch the dapp's connected chain.
 *
 * This simulates a wallet-initiated chain switch: the user opens MetaMask,
 * selects a different network for this dapp — MetaMask then fires
 * `chainChanged` on the dapp's provider.
 *
 * @param driver      - Selenium driver
 * @param networkName - MetaMask display name of the target network (e.g. 'Linea')
 */
async function switchChainFromWallet(
  driver: Driver,
  networkName: string,
): Promise<void> {
  await driver.openNewPage(
    `${driver.extensionUrl}/${PAGES.POPUP}.html?activeTabOrigin=${DAPP_URL}`,
  );
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openDappNetworkMenu();
  await headerNavbar.selectNetwork(networkName);
}

describe('MM Connect-EVM', function (this: Suite) {
  describe('Legacy EVM', function (this: Suite) {
    it('reflects wallet account switch in the dapp via accountsChanged', async function () {
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

          await testDapp.connectLegacy();
          await approveConnect(driver, { totalAccounts: 2 });
          await testDapp.switchTo();

          // Account 1 should appear in the card after the connect event fires.
          await testDapp.checkLegacyCardVisible();
          await testDapp.waitForLegacyActiveAccount(
            DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
          );

          // Switch to Account 2 in the wallet and verify the dapp updates.
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.switchToAccount('Account 2');

          await testDapp.switchTo();
          await testDapp.waitForLegacyActiveAccount(ACCOUNT_2);
        },
      );
    });

    it('completes personal_sign successfully', async function () {
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
          await testDapp.connectLegacy();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkLegacyCardVisible();

          // Trigger personal_sign without waiting for the result yet.
          await testDapp.clickLegacyPersonalSign();

          // Approve the signing dialog in the extension.
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const signingConfirmation = new Confirmation(driver);
          await signingConfirmation.checkPageIsLoaded();
          await signingConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

          // Back on the dapp: verify the response is a hex signature.
          await testDapp.switchTo();
          await testDapp.checkLegacyResponse('0x');
        },
      );
    });

    it('completes eth_sendTransaction successfully', async function () {
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
          await testDapp.connectLegacy();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkLegacyCardVisible();
          await testDapp.waitForLegacyActiveAccount(
            DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
          );

          // Trigger eth_sendTransaction.
          await testDapp.clickLegacySendTransaction();

          // Approve the transaction in the extension.
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const txConfirmation = new Confirmation(driver);
          await txConfirmation.checkPageIsLoaded();
          await txConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

          // Back on the dapp: verify the response contains a tx hash.
          await testDapp.switchTo();
          await testDapp.checkLegacyResponse('0x');
        },
      );
    });

    it('reflects wallet-initiated chain switch in the connected dapp', async function () {
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
          await testDapp.connectLegacy();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkLegacyCardVisible();

          // Record the initial chain so we can confirm it changes.
          const initialChainId = await testDapp.getLegacyChainId();

          // Switch the dapp's network to Linea via MetaMask's connection menu.
          // MetaMask fires chainChanged(CHAIN_IDS.LINEA_MAINNET) on the dapp's provider.
          await switchChainFromWallet(driver, 'Linea');

          // Back on the dapp: chain-ID display must show Linea's hex chain ID.
          await testDapp.switchTo();
          await testDapp.waitForLegacyChainId(CHAIN_IDS.LINEA_MAINNET);
          assert.notStrictEqual(
            initialChainId,
            CHAIN_IDS.LINEA_MAINNET,
            'Initial chain should differ from Linea so we can confirm the switch occurred',
          );
        },
      );
    });

    it('reflects dapp-initiated chain switch in the wallet', async function () {
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
          await testDapp.connectLegacy();
          // Pre-permit Polygon so the switch only tests chain-switching, not
          // the combined "approve new network + switch" flow.
          await approveConnect(driver, { extraNetworks: ['Polygon'] });
          await testDapp.switchTo();
          await testDapp.checkLegacyCardVisible();

          // Click "Switch to Polygon" in the card — triggers wallet_switchEthereumChain.
          await testDapp.clickLegacySwitchToPolygon();

          // Back on the dapp: chain-ID display must show Polygon's hex chain ID.
          await testDapp.switchTo();
          await testDapp.waitForLegacyChainId(CHAIN_IDS.POLYGON);

          // Open the MetaMask popup from the dapp's context and verify the
          // connection menu popover shows Polygon — confirming the wallet's
          // active chain matches what the dapp reports.
          await driver.openNewPage(
            `${driver.extensionUrl}/${PAGES.POPUP}.html?activeTabOrigin=${DAPP_URL}`,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.checkConnectedSitePopoverNetwork('Polygon');
        },
      );
    });
  });

  describe('Wagmi', function (this: Suite) {
    it('reflects wallet account switch in the dapp via accountsChanged', async function () {
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

          await testDapp.connectWagmi();
          await approveConnect(driver, { totalAccounts: 2 });
          await testDapp.switchTo();

          // Account 1 should appear in the wagmi card after the connect event fires.
          await testDapp.checkWagmiCardVisible();
          await testDapp.waitForWagmiActiveAccount(
            DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
          );

          // Switch to Account 2 in the wallet and verify the dapp updates.
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.switchToAccount('Account 2');

          await testDapp.switchTo();
          await testDapp.waitForWagmiActiveAccount(ACCOUNT_2);
        },
      );
    });

    it('completes personal_sign successfully', async function () {
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
          await testDapp.connectWagmi();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkWagmiCardVisible();

          // Submit the sign-message form (wagmi useSignMessage → personal_sign).
          await testDapp.signWagmiMessage('Hello from E2E test');

          // Approve the signing dialog in the extension.
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const signingConfirmation = new Confirmation(driver);
          await signingConfirmation.checkPageIsLoaded();
          await signingConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

          // Back on the dapp: verify the signature result element shows 0x...
          await testDapp.switchTo();
          await testDapp.checkWagmiSignatureResult('0x');
        },
      );
    });

    it('completes eth_sendTransaction successfully', async function () {
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
          await testDapp.connectWagmi();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkWagmiCardVisible();

          // Submit the send-transaction form.
          await testDapp.sendWagmiTransaction(
            DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
            '0.00001',
          );

          // Approve the transaction in the extension.
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const txConfirmation = new Confirmation(driver);
          await txConfirmation.checkPageIsLoaded();
          await txConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

          // Back on the dapp: verify the tx hash is shown.
          await testDapp.switchTo();
          await testDapp.checkWagmiTxHash('0x');
        },
      );
    });

    it('reflects wallet-initiated chain switch in the connected dapp', async function () {
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
          await testDapp.connectWagmi();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkWagmiCardVisible();

          // Record the initial chain ID.
          const initialChainId = await testDapp.getWagmiChainId();

          // Switch the dapp's network to Optimism (name "OP" in the fixture) via
          // MetaMask's per-dapp connection menu.
          await switchChainFromWallet(driver, 'OP');

          // Back on the dapp: chain ID must update to 10 (Optimism).
          await testDapp.switchTo();
          await testDapp.waitForWagmiChainId(String(OPTIMISM_CHAIN_ID));
          assert.notStrictEqual(
            initialChainId,
            String(OPTIMISM_CHAIN_ID),
            'Initial chain should differ from Optimism so the switch is meaningful',
          );
        },
      );
    });

    it('reflects dapp-initiated chain switch in the wallet', async function () {
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
          await testDapp.connectWagmi();

          await approveConnect(driver, { extraNetworks: ['Optimism'] });
          await testDapp.switchTo();
          await testDapp.checkWagmiCardVisible();

          // Click the wagmi "Switch to Optimism" button (chain ID 10).
          // Triggers wallet_switchEthereumChain('0xa').
          await testDapp.clickWagmiSwitchChain(OPTIMISM_CHAIN_ID);

          // Back on the dapp: chain-ID display must update to 10 (Optimism).
          await testDapp.waitForWagmiChainId(String(OPTIMISM_CHAIN_ID));

          // Open the MetaMask popup from the dapp's context and verify the
          // connection menu popover shows Optimism — confirming the wallet's
          // active chain matches what the dapp reports.
          await driver.openNewPage(
            `${driver.extensionUrl}/${PAGES.POPUP}.html?activeTabOrigin=${DAPP_URL}`,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.checkConnectedSitePopoverNetwork('OP');
        },
      );
    });
  });
});
