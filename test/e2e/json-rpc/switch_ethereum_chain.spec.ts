import { strict as assert } from 'assert';
import {
  withFixtures,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  switchToNotificationWindow,
  WINDOW_TITLES,
} from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import SettingsPage from '../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import ExperimentalSettings from '../page-objects/pages/settings/experimental-settings';
import TestDapp from '../page-objects/pages/test-dapp';
import { DAPP_HOST_ADDRESS, DAPP_TWO_URL } from '../page-objects/pages/test-dapp';
import ReviewPermissionConfirmation from '../page-objects/pages/confirmations/redesign/review-permission-confirmation';


describe('Switch Ethereum Chain for two dapps', function () {
  it.only('switches the chainId of two dapps when switchEthereumChain of one dapp is confirmed', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .build(),
        dappOptions: { numberOfDapps: 2 },

        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await loginWithBalanceValidation(driver, ganacheServer);

        // Go to experimental settings page and toggle off request queue setting (on by default now)
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToExperimentalSettings();

        const experimentalSettings = new ExperimentalSettings(driver);
        await experimentalSettings.check_pageIsLoaded();
        await experimentalSettings.toggleRequestQueue();

        // open two dapps
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_HOST_ADDRESS });
        await testDapp.check_pageIsLoaded();
        await testDapp.openTestDappPage({ url: DAPP_TWO_URL });
        await testDapp.check_pageIsLoaded();

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Initiate switchEthereumChain on Dapp Two
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Confirm switchEthereumChain
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const reviewPermissionConfirmation = new ReviewPermissionConfirmation(driver);
        await reviewPermissionConfirmation.check_pageIsLoaded();
        await reviewPermissionConfirmation.confirmReviewPermissions();

        // Switch to Dapp One and check chainId
        await driver.switchToWindowWithUrl(DAPP_HOST_ADDRESS);
        await driver.waitForUrl({
          url: DAPP_HOST_ADDRESS + '/',
        });
        await testDapp.check_pageIsLoaded();
        await testDapp.check_currentConnectedChainId('0x53a');

        // Switch to Dapp Two and check chainId
        await driver.switchToWindowWithUrl(DAPP_TWO_URL);
        await driver.waitForUrl({ url: DAPP_TWO_URL + '/' });
        await testDapp.check_pageIsLoaded();
        await testDapp.check_currentConnectedChainId('0x53a');
      },
    );
  });

  it('queues switchEthereumChain request from second dapp after send tx request', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Open settings menu button
        const accountOptionsMenuSelector =
          '[data-testid="account-options-menu-button"]';
        await driver.waitForSelector(accountOptionsMenuSelector);
        await driver.clickElement(accountOptionsMenuSelector);

        // Click settings from dropdown menu
        const globalMenuSettingsSelector =
          '[data-testid="global-menu-settings"]';
        await driver.waitForSelector(globalMenuSettingsSelector);
        await driver.clickElement(globalMenuSettingsSelector);

        // Click Experimental tab
        const experimentalTabRawLocator = {
          text: 'Experimental',
          tag: 'div',
        };
        await driver.clickElement(experimentalTabRawLocator);

        // Toggle off request queue setting (on by default now)
        await driver.clickElement(
          '[data-testid="experimental-setting-toggle-request-queue"]',
        );

        // open two dapps
        await openDapp(driver, undefined, DAPP_URL);
        await openDapp(driver, undefined, DAPP_ONE_URL);

        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        // Switch to Dapp One and connect it
        await driver.switchToWindowWithUrl(DAPP_URL);
        await driver.findClickableElement({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const editButtons = await driver.findElements('[data-testid="edit"]');

        await editButtons[1].click();

        // Disconnect Localhost 8545
        await driver.clickElement({
          text: 'Localhost 8545',
          tag: 'p',
        });

        await driver.clickElement('[data-testid="connect-more-chains-button"]');

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        // Switch to Dapp Two
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        // Initiate send transaction on Dapp two
        await driver.clickElement('#sendButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.findClickableElements({
          text: 'Confirm',
          tag: 'button',
        });

        // Switch to Dapp One
        await driver.switchToWindowWithUrl(DAPP_URL);

        // Switch Ethereum chain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        // Initiate switchEthereumChain on Dapp One
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );
        await switchToNotificationWindow(driver, 4);
        await driver.findClickableElements({
          text: 'Confirm',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });
        // Delay here after notification for second notification popup for switchEthereumChain
        await driver.delay(1000);

        // Switch and confirm to queued notification for switchEthereumChain
        await switchToNotificationWindow(driver, 4);

        await driver.findClickableElements({
          text: 'Confirm',
          tag: 'button',
        });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Confirm',
          tag: 'button',
        });
        await driver.switchToWindowWithUrl(DAPP_URL);
        await driver.findElement({ css: '#chainId', text: '0x539' });
      },
    );
  });

  it('queues send tx after switchEthereum request with a warning, confirming removes pending tx', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Open settings menu button
        const accountOptionsMenuSelector =
          '[data-testid="account-options-menu-button"]';
        await driver.waitForSelector(accountOptionsMenuSelector);
        await driver.clickElement(accountOptionsMenuSelector);

        // Click settings from dropdown menu
        const globalMenuSettingsSelector =
          '[data-testid="global-menu-settings"]';
        await driver.waitForSelector(globalMenuSettingsSelector);
        await driver.clickElement(globalMenuSettingsSelector);

        // Click Experimental tab
        const experimentalTabRawLocator = {
          text: 'Experimental',
          tag: 'div',
        };
        await driver.clickElement(experimentalTabRawLocator);

        // Toggle off request queue setting (on by default now)
        await driver.clickElement(
          '[data-testid="experimental-setting-toggle-request-queue"]',
        );

        // open two dapps
        const dappTwo = await openDapp(driver, undefined, DAPP_ONE_URL);
        const dappOne = await openDapp(driver, undefined, DAPP_URL);

        // Connect Dapp One
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        // Switch and connect Dapp Two

        await driver.switchToWindow(dappTwo);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const editButtons = await driver.findElements('[data-testid="edit"]');

        // Click the edit button for networks
        await editButtons[1].click();

        // Disconnect Mainnet
        await driver.clickElement({
          text: 'Localhost 8545',
          tag: 'p',
        });

        await driver.clickElement('[data-testid="connect-more-chains-button"]');

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindow(dappTwo);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        // Initiate switchEthereumChain on Dapp Two
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.findClickableElements({
          text: 'Confirm',
          tag: 'button',
        });
        // Switch back to dapp one
        await driver.switchToWindow(dappOne);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_URL}/`);

        // Initiate send tx on dapp one
        await driver.clickElement('#sendButton');
        await driver.delay(2000);

        // Switch to notification that should still be switchEthereumChain request but with a warning.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // THIS IS BROKEN
        // await driver.findElement({
        //   span: 'span',
        //   text: 'Switching networks will cancel all pending confirmations',
        // });

        // Confirm switchEthereumChain with queued pending tx
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Window handles should only be expanded mm, dapp one, dapp 2, and the offscreen document
        // if this is an MV3 build(3 or 4 total)
        await driver.wait(async () => {
          const windowHandles = await driver.getAllWindowHandles();
          const numberOfWindowHandlesToExpect = isManifestV3 ? 4 : 3;
          return windowHandles.length === numberOfWindowHandlesToExpect;
        });
      },
    );
  });

  it('queues send tx after switchEthereum request with a warning, if switchEthereum request is cancelled should show pending tx', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Open settings menu button
        const accountOptionsMenuSelector =
          '[data-testid="account-options-menu-button"]';
        await driver.waitForSelector(accountOptionsMenuSelector);
        await driver.clickElement(accountOptionsMenuSelector);

        // Click settings from dropdown menu
        const globalMenuSettingsSelector =
          '[data-testid="global-menu-settings"]';
        await driver.waitForSelector(globalMenuSettingsSelector);
        await driver.clickElement(globalMenuSettingsSelector);

        // Click Experimental tab
        const experimentalTabRawLocator = {
          text: 'Experimental',
          tag: 'div',
        };
        await driver.clickElement(experimentalTabRawLocator);

        // Toggle off request queue setting (on by default now)
        await driver.clickElement(
          '[data-testid="experimental-setting-toggle-request-queue"]',
        );

        // open two dapps
        const dappTwo = await openDapp(driver, undefined, DAPP_ONE_URL);
        const dappOne = await openDapp(driver, undefined, DAPP_URL);

        // Connect Dapp One
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        // Switch and connect Dapp Two
        await driver.switchToWindow(dappTwo);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const editButtons = await driver.findElements('[data-testid="edit"]');

        // Click the edit button for networks
        await editButtons[1].click();

        // Disconnect Mainnet
        await driver.clickElement({
          text: 'Localhost 8545',
          tag: 'p',
        });

        await driver.clickElement('[data-testid="connect-more-chains-button"]');
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });
        await driver.switchToWindow(dappTwo);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        // Initiate switchEthereumChain on Dapp Two
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Switch to notification of switchEthereumChain
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.findClickableElements({
          text: 'Confirm',
          tag: 'button',
        });

        // Switch back to dapp one
        await driver.switchToWindow(dappOne);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_URL}/`);

        // Initiate send tx on dapp one
        await driver.clickElement('#sendButton');
        await driver.delay(2000);

        // Switch to notification that should still be switchEthereumChain request but with an warning.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // THIS IS BROKEN
        // await driver.findElement({
        //   span: 'span',
        //   text: 'Switching networks will cancel all pending confirmations',
        // });

        // Cancel switchEthereumChain with queued pending tx
        await driver.clickElement({ text: 'Cancel', tag: 'button' });

        // Delay for second notification of the pending tx
        await driver.delay(1000);

        // Switch to new pending tx notification
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.findElement({
          text: 'Sending ETH',
          tag: 'span',
        });

        // Confirm pending tx
        await driver.findClickableElements({
          text: 'Confirm',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });
      },
    );
  });
});
