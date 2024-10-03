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
        const windowHandlesPreClick = await driver.waitUntilXWindowHandles(
          2,
          1000,
          10000,
        );
        await driver.clickElement('#maliciousPermit'); // Opens the extension in popup view.
        const windowHandlesPostClick = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        const [newWindowHandle] = windowHandlesPostClick.filter(
          (handleId) => !windowHandlesPreClick.includes(handleId),
        );

        await driver.switchToHandleAndWaitForTitleToBe(
          newWindowHandle,
          WINDOW_TITLES.Dialog,
        );
      },
    );
  });
});
