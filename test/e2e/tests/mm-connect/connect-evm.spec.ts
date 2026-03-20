import assert from 'assert';
import { Suite } from 'mocha';

import {
  ACCOUNT_2,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  DAPP_PATH,
  DAPP_URL,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { Driver, PAGES } from '../../webdriver/driver';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import EditConnectedAccountsModal from '../../page-objects/pages/dialog/edit-connected-accounts-modal';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/review-permissions-confirmation';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { TestDappMmConnect as TestDapp } from '../../page-objects/pages/test-dapp-mm-connect';

const OPTIMISM_CHAIN_ID = 10;

// ── Shared fixture options ─────────────────────────────────────────────────

const MM_CONNECT_TEST_DAPP_OPTIONS = {
  customDappPaths: [DAPP_PATH.TEST_DAPP_MM_CONNECT],
};

// ── Shared helpers ─────────────────────────────────────────────────────────

/**
 * Approve the MetaMask connect dialog after the dapp has initiated a
 * connection. Switches to the dialog, optionally adds extra accounts, then
 * confirms. The caller is responsible for triggering the connect action on the
 * dapp and for switching focus back to it afterwards.
 *
 * @param driver        - Selenium driver
 * @param totalAccounts - Total number of accounts to connect (default: 1)
 */
async function approveConnect(
  driver: Driver,
  totalAccounts: number = 1,
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
  await headerNavbar.openConnectionMenu();
  await headerNavbar.clickConnectedSitePopoverNetworkButton();
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
          await loginWithBalanceValidation(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();

          await testDapp.connectLegacy();
          await approveConnect(driver, 2);
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
          await loginWithBalanceValidation(driver);

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
          await signingConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

          // Back on the dapp: verify the response is a hex signature.
          await testDapp.switchTo();
          await testDapp.checkLegacyResponse('0x');
        },
      );
    });

    // TODO(wenfix): Change this test to approve eth_sendTransaction
    // Currently our testdapp hardcodes the recipient and value for the transaction
    // which causes several alerts to be shown during confirmation,
    // making it difficult to approve the transaction.
    // We should change the testdapp to allow a dynamic recipient and value.
    // Ticket: https://consensyssoftware.atlassian.net/browse/WAPI-1258
    it('rejects eth_sendTransaction', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: MM_CONNECT_TEST_DAPP_OPTIONS,
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();
          await testDapp.connectLegacy();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkLegacyCardVisible();

          // Trigger eth_sendTransaction (the card uses a fixed recipient/value).
          await testDapp.clickLegacySendTransaction();

          // Approve the transaction in the extension.
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const txConfirmation = new Confirmation(driver);
          await txConfirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

          // Back on the dapp: the transaction should be rejected.
          await testDapp.switchTo();
          await testDapp.checkLegacyResponse(
            'User denied transaction signature',
          );
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
          await loginWithBalanceValidation(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();
          await testDapp.connectLegacy();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkLegacyCardVisible();

          // Record the initial chain so we can confirm it changes.
          const initialChainId = await testDapp.getLegacyChainId();

          // Switch the dapp's network to Linea via MetaMask's connection menu.
          // MetaMask fires chainChanged('0xe708') on the dapp's provider.
          await switchChainFromWallet(driver, 'Linea');

          // Back on the dapp: chain-ID display must show Linea's hex chain ID.
          await testDapp.switchTo();
          await testDapp.waitForLegacyChainId('0xe708');
          assert.notStrictEqual(
            initialChainId,
            '0xe708',
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
          await loginWithBalanceValidation(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();
          await testDapp.connectLegacy();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkLegacyCardVisible();

          // Click "Switch to Polygon" in the card — triggers wallet_switchEthereumChain.
          await testDapp.clickLegacySwitchToPolygon();

          // Polygon isn't in the default network list, so MetaMask first shows
          // a "Review permissions" modal before the switch confirmation.
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const reviewPermissions = new ReviewPermissionsConfirmation(driver);
          await reviewPermissions.checkPageIsLoaded();
          await reviewPermissions.confirmReviewPermissions();

          // Back on the dapp: chain-ID display must show Polygon's hex chain ID.
          await testDapp.switchTo();
          await testDapp.waitForLegacyChainId('0x89');

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
          await loginWithBalanceValidation(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();

          await testDapp.connectWagmi();
          await approveConnect(driver, 2);
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
          await loginWithBalanceValidation(driver);

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
          await signingConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

          // Back on the dapp: verify the signature result element shows 0x...
          await testDapp.switchTo();
          await testDapp.checkWagmiSignatureResult('0x');
        },
      );
    });

    it('rejects eth_sendTransaction', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: MM_CONNECT_TEST_DAPP_OPTIONS,
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();
          await testDapp.connectWagmi();
          await approveConnect(driver);
          await testDapp.switchTo();
          await testDapp.checkWagmiCardVisible();

          // Submit the send-transaction form. Use a tiny amount to the zero address.
          await testDapp.sendWagmiTransaction(
            '0x0000000000000000000000000000000000000000',
            '0.0001',
          );

          // TODO: Change this test to accept the tx once https://consensyssoftware.atlassian.net/browse/WAPI-1258
          // is resolved. See the comment in the same test on the Legacy EVM test suite above for more details.

          // Reject the transaction in the extension.
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const txConfirmation = new Confirmation(driver);
          await txConfirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

          await testDapp.switchTo();
          await testDapp.checkWagmiTxError('unknown RPC error');
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
          await loginWithBalanceValidation(driver);

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
          await loginWithBalanceValidation(driver);

          const testDapp = new TestDapp(driver);
          await testDapp.openPage();
          await testDapp.connectWagmi();
          await approveConnect(driver);
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
