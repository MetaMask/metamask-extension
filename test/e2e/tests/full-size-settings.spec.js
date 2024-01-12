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

const toggleFullSizeSetting = async (driver) => {
  await driver.clickElement('[data-testid="account-options-menu-button"]');

  await driver.clickElement({ text: 'Settings', tag: 'div' });
  await driver.clickElement({ text: 'Advanced', tag: 'div' });

  await driver.clickElement(
    '[data-testid="advanced-setting-show-extension-in-full-size-view"] .toggle-button > div',
  );
};

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
        await toggleFullSizeSetting(driver);
        await openDapp(driver);

        await driver.clickElement('#maliciousPermit');
        // TODO
        const windowHandles = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        const fullScreenWindowTitle = await driver.getWindowTitleByHandlerId(
          windowHandles[0],
        );
        const dappWindowTitle = await driver.getWindowTitleByHandlerId(
          windowHandles[1],
        );
        const popUpWindowTitle = await driver.getWindowTitleByHandlerId(
          windowHandles[2],
        );

        assert.equal(
          fullScreenWindowTitle,
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        assert.equal(dappWindowTitle, WINDOW_TITLES.TestDApp);
        assert.equal(popUpWindowTitle, WINDOW_TITLES.Dialog);
      },
    );
  });

  it.only('opens the extension in full-size view after enabling it in Advanced Settings', async function () {
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

        await toggleFullSizeSetting(driver);

        const actions = driver.retrieveDriverActions();
        console.log(driver.Key, driver.Key.OPTION, driver.Key.M);
        const el = await driver.findElement(By.tagName('html'));
        console.log({ el });
        await actions
          .sendKeys(
            Key.chord(driver.Key.SHIFT, driver.Key.OPTION, driver.Key.M),
          )
          .perform();
        // await actions
        //   .keyDown(driver.Key.SHIFT)
        //   .keyDown(driver.Key.OPTION)
        //   .keyDown(driver.Key.M)
        //   .perform();
        // .keyDown(driver.Key.OPTION)
        // .keyDown(driver.Key.M)
        // .perform();
        // await driver.wait(40000000);
        // await driver
        //   .actions()
        //   .keyDown(Key.SHIFT)
        //   .keyDown(Key.OPTION)
        //   .keyDown(Key.M)
        //   .perform();
         await getWindowHandles(driver, 2);
      },
    );
  });
});
