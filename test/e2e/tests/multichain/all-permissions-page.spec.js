const { strict: assert } = require('assert');
const {
  withFixtures,
  WINDOW_TITLES,
  connectToDapp,
  logInWithBalanceValidation,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Permissions Page', function () {
  it('should show connected site permissions when a single dapp is connected', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        await connectToDapp(driver);

        // close test dapp window to avoid future confusion
        const windowHandles = await driver.getAllWindowHandles();
        await driver.closeWindowHandle(windowHandles[1]);
        // disconnect dapp in fullscreen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'All Permissions', tag: 'div' });
        await driver.clickElementAndWaitToDisappear({
          text: 'Got it',
          tag: 'button',
        });
        const connectedDapp = await driver.isElementPresent({
          text: '127.0.0.1:8080',
          tag: 'p',
        });
        assert.ok(connectedDapp, 'Account connected to Dapp1');
      },
    );
  });

  it('should show all permissions listed when experimental settings toggle is off', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        await connectToDapp(driver);

        // close test dapp window to avoid future confusion
        const windowHandles = await driver.getAllWindowHandles();
        await driver.closeWindowHandle(windowHandles[1]);
        // disconnect dapp in fullscreen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({
          text: 'Experimental',
          tag: 'div',
        });

        await driver.clickElement(
          '[data-testid="experimental-setting-toggle-request-queue"] label',
        );
        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'All Permissions', tag: 'div' });
        await driver.clickElementAndWaitToDisappear({
          text: 'Got it',
          tag: 'button',
        });
        const connectedDapp = await driver.isElementPresent({
          text: '127.0.0.1:8080',
          tag: 'p',
        });
        assert.ok(connectedDapp, 'Account connected to Dapp1');
      },
    );
  });
});
