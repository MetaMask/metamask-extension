const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  openDapp,
  defaultGanacheOptions,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

const toggleFullSizeViewSetting = async (driver) => {
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  await driver.clickElement({ text: 'Settings', tag: 'div' });
  await driver.clickElement({ text: 'Advanced', tag: 'div' });
  await driver.clickElement(
    '[data-testid="advanced-setting-show-extension-in-full-size-view"] .toggle-button > div',
  );
};

describe('Full-size View Setting @no-mmi', function () {
  it('opens the extension in popup view when opened from a dapp after enabling it in Advanced Settings', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await toggleFullSizeViewSetting(driver);
        await openDapp(driver);
        await driver.clickElement('#maliciousPermit'); // Opens the extension in popup view.
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
});
