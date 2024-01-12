const { strict: assert } = require('assert');
const { Key, By, Actions } = require('selenium-webdriver');
const {
  withFixtures,
  unlockWallet,
  openDapp,
  defaultGanacheOptions,
  getWindowHandles,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Full-size Settings @no-mmi', function () {
  it('opens the extension in popup view when opened from a dapp after enabling it in Advanced Settings', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        failOnConsoleError: false,
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });

        await driver.clickElement(
          '[data-testid="advanced-setting-show-extension-in-full-size-view"] .toggle-button > div',
        );

        await openDapp(driver);

        await driver.clickElement('#maliciousPermit');
        const windowHandles = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
          windowHandles,
        );
      },
    );
  });

  it('opens the extension in full-size view after enabling it in Advanced Settings', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        failOnConsoleError: false,
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });

        await driver.clickElement(
          '[data-testid="advanced-setting-show-extension-in-full-size-view"] .toggle-button > div',
        );

        await openDapp(driver);

        const actions = new Actions(driver);
        actions.keyDown(Key.SHIFT).keyDown(Key.OPTION).keyDown(Key.M).perform();

        // await driver
        //   .actions()
        //   .keyDown(Key.SHIFT)
        //   .keyDown(Key.OPTION)
        //   .keyDown(Key.M)
        //   .perform();

        // await driver.clickElement('#maliciousPermit');
        const windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);
        await driver.waitForSelector({ text: 'Install' });
      },
    );
  });
});
