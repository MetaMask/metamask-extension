const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  openDapp,
  DAPP_URL,
  DAPP_ONE_URL,
  unlockWallet,
  switchToNotificationWindow,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { isManifestV3 } = require('../../../shared/modules/mv3.utils');

describe('Switch Ethereum Chain for two dapps', function () {
  it('switches the chainId of two dapps when switchEthereumChain of one dapp is confirmed', async function () {
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
        title: this.test.fullTitle(),
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
        const dappOne = await openDapp(driver, undefined, DAPP_URL);
        const dappTwo = await openDapp(driver, undefined, DAPP_ONE_URL);

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
        await switchToNotificationWindow(driver, 4);
        await driver.findClickableElements({
          text: 'Confirm',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Switch to Dapp One
        await driver.switchToWindow(dappOne);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_URL}/`);

        // Wait for chain id element to change, there's a page reload.
        await driver.waitForSelector({
          css: '#chainId',
          text: '0x53a',
        });

        // Dapp One ChainId assertion
        await driver.findElement({ css: '#chainId', text: '0x53a' });

        // Switch to Dapp Two
        await driver.switchToWindow(dappTwo);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        // Dapp Two ChainId Assertion
        await driver.findElement({ css: '#chainId', text: '0x53a' });
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
        title: this.test.fullTitle(),
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
        const dappOne = await openDapp(driver, undefined, DAPP_URL);
        const dappTwo = await openDapp(driver, undefined, DAPP_ONE_URL);

        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindow(dappTwo);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        // Initiate send transaction on Dapp two
        await driver.clickElement('#sendButton');
        await driver.delay(2000);

        // Switch to Dapp One
        await driver.switchToWindow(dappOne);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_URL}/`);

        // Switch Ethereum chain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Initiate switchEthereumChain on Dapp One
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Switch to tx and confirm send tx.
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
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
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
        title: this.test.fullTitle(),
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

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        })

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
        title: this.test.fullTitle(),
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

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        })

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
