const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  generateGanacheOptions,
  WALLET_PASSWORD,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const WINDOW_TITLES = Object.freeze({
  ExtensionInFullScreenView: 'MetaMask',
  TestDApp: 'E2E Test Dapp',
  Notification: 'MetaMask Notification',
  ServiceWorkerSettings: 'Inspect with Chrome Developer Tools',
  InstalledExtensions: 'Extensions',
});

describe('MV3 - Restart service worker multiple times', function () {
  it('Simple simple send flow within full screen view should still be usable', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: generateGanacheOptions(),
        title: this.test.title,
        driverOptions: { openDevToolsForTabs: true },
      },
      async ({ driver, ganacheServer }) => {
        await driver.navigate();

        await unlockWallet(driver, WALLET_PASSWORD);

        await sleepSeconds(1);
        await assertETHBalance(ganacheServer, '25');

        // first send ETH and then terminate SW
        const RECIPIENT_ADDRESS = '0x985c30949c92df7a0bd42e0f3e3d539ece98db24';
        await simpleSendETH(driver, '1', RECIPIENT_ADDRESS);
        await terminateServiceWorker(driver);

        await assertETHBalance(ganacheServer, '24.0000');

        // first send ETH #2 and then terminate SW
        await switchToWindow(driver, WINDOW_TITLES.ExtensionInFullScreenView);
        await simpleSendETH(driver, '1', RECIPIENT_ADDRESS);
        await terminateServiceWorker(driver);

        await assertETHBalance(ganacheServer, '22.9999');

        // first terminate SW and then send ETH
        await switchToWindow(driver, WINDOW_TITLES.ExtensionInFullScreenView);
        await terminateServiceWorker(driver);

        await switchToWindow(driver, WINDOW_TITLES.ExtensionInFullScreenView);
        await simpleSendETH(driver, '1', RECIPIENT_ADDRESS);

        await sleepSeconds(2);
        await assertETHBalance(ganacheServer, '21.9999');
      },
    );
  });

  it('Should continue to support dapp interactions after service worker re-starts multiple times', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: generateGanacheOptions({
          concurrent: { port: 8546, chainId: 1338 },
        }),
        title: this.test.title,
        driverOptions: { openDevToolsForTabs: true },
      },
      async ({ driver }) => {
        await driver.navigate();

        await unlockWallet(driver, WALLET_PASSWORD);

        await openDapp(driver);

        // Click add Ethereum chain
        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(2);

        // Notification pop up opens
        await switchToWindow(driver, WINDOW_TITLES.Notification);
        let notification = await driver.isElementPresent({
          text: 'Allow this site to add a network?',
          tag: 'h3',
        });
        assert.ok(notification, 'Dapp action does not appear in Metamask');

        // Cancel Notification
        await driver.clickElement({ text: 'Cancel', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);

        // Terminate Service Worker
        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        sleepSeconds(1);
        await terminateServiceWorker(driver);

        // Click add Ethereum chain #2
        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(2);

        // Notification pop up opens
        await switchToWindow(driver, WINDOW_TITLES.Notification);
        notification = await driver.isElementPresent({
          text: 'Allow this site to add a network?',
          tag: 'h3',
        });
        assert.ok(notification, 'Dapp action does not appear in Metamask');

        // Cancel Notification
        await driver.clickElement({ text: 'Cancel', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);

        // Terminate Service Worker
        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await terminateServiceWorker(driver);

        // Click add Ethereum chain #3
        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(2);

        await sleepSeconds(0.1);

        // Notification pop up opens
        await switchToWindow(driver, WINDOW_TITLES.Notification);
        notification = await driver.isElementPresent({
          text: 'Allow this site to add a network?',
          tag: 'h3',
        });
        assert.ok(notification, 'Dapp action does not appear in Metamask');

        // Accept Notification
        await driver.clickElement({ text: 'Approve', tag: 'button' });
        await driver.clickElement({ text: 'Switch network', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
      },
    );
  });

  it('Should lock wallet when a browser session ends (after turning off the extension', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: generateGanacheOptions({
          concurrent: { port: 8546, chainId: 1338 },
        }),
        title: this.test.title,
      },
      async ({ driver }) => {
        const { extensionUrl } = driver;
        const extensionId = extensionUrl.split('//')[1];

        await driver.navigate();

        await unlockWallet(driver, WALLET_PASSWORD);

        await reloadExtension(driver, extensionId);

        // ensure extension finishes reloading before reopening full screen extension
        await sleepSeconds(0.1);

        await driver.openNewPage(`${extensionUrl}/home.html`);

        const passwordField = await driver.isElementPresent('#password');
        assert.ok(
          passwordField,
          'Password screen is not visible. Wallet should have been locked.',
        );
      },
    );
  });
});

async function reloadExtension(driver, extensionId) {
  await driver.openNewPage('chrome://extensions/');

  // extensions-manager
  const extensionsManager = await driver.findElement('extensions-manager');

  // shadowRoot
  const extensionsManagerShadowRoot = await driver.executeScript(
    'return arguments[0][0].shadowRoot',
    extensionsManager,
  );

  // cr-view-manager
  const viewManager = await extensionsManagerShadowRoot.findElement({
    css: '#viewManager',
  });

  // extensions-item-list
  const itemList = await viewManager.findElement({
    css: '#items-list',
  });

  // shadowRoot
  const itemListShadowRoot = await driver.executeScript(
    'return arguments[0][0].shadowRoot',
    itemList,
  );

  // extension-item
  const extensionItem = await await itemListShadowRoot.findElement({
    css: `#${extensionId}`,
  });

  // shadowRoot
  const extensionItemShadowRoot = await driver.executeScript(
    'return arguments[0][0].shadowRoot',
    extensionItem,
  );

  // cr-icon-button
  const devReloadButton = await extensionItemShadowRoot.findElement({
    css: '#dev-reload-button',
  });

  // shadowRoot
  const devReloadButtonShadowRoot = await driver.executeScript(
    'return arguments[0][0].shadowRoot',
    devReloadButton,
  );

  // cr-icon-button
  const reloadBtn = await devReloadButtonShadowRoot.findElement({
    css: '#maskedImage',
  });

  await reloadBtn.click();
}

async function unlockWallet(driver, walletPassword) {
  await driver.fill('#password', walletPassword);
  await driver.press('#password', driver.Key.ENTER);
}

async function assertETHBalance(ganacheServer, expectedBalance) {
  await sleepSeconds(0.1);
  const balance = await ganacheServer.getBalance();

  assert.equal(String(balance), expectedBalance);
}

async function simpleSendETH(driver, value, recipient) {
  await driver.clickElement('[data-testid="eth-overview-send"]');
  await driver.fill('[data-testid="ens-input"]', recipient);
  await driver.fill('.unit-input__input', value);
  await driver.clickElement('[data-testid="page-container-footer-next"]');
  await driver.clickElement('[data-testid="page-container-footer-next"]');
  await driver.clickElement('[data-testid="home__activity-tab"]');
  await driver.findElement('.transaction-list-item');
  // reset view to assets tab
  await driver.clickElement('[data-testid="home__asset-tab"]');
}

async function terminateServiceWorker(driver) {
  await driver.openNewPage('chrome://inspect/#service-workers/');

  await driver.clickElement({
    text: 'Service workers',
    tag: 'button',
  });

  await driver.clickElement({
    text: 'terminate',
    tag: 'span',
  });

  const serviceWorkerTab = await switchToWindow(
    driver,
    WINDOW_TITLES.ServiceWorkerSettings,
  );

  await driver.closeWindowHandle(serviceWorkerTab);
}

async function switchToWindow(driver, windowTitle) {
  const windowHandles = await driver.getAllWindowHandles();

  return await driver.switchToWindowWithTitle(windowTitle, windowHandles);
}

async function sleepSeconds(sec) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}
