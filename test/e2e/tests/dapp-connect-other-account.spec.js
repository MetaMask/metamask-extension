const { strict: assert } = require('assert');
const { toHex } = require('@metamask/controller-utils');
const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  DAPP_URL,
  DAPP_ONE_URL,
  unlockWallet,
  WINDOW_TITLES,
  generateGanacheOptions,
  regularDelayMs,
  switchToNotificationWindow,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { PAGES } = require('../webdriver/driver');

describe('Dapp connect toast', function () {
  it('should display when an account other than the current account is connected', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: generateGanacheOptions({
          concurrent: { port: 8546, chainId: 1338 },
        }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        await unlockWallet(driver);
        await openDapp(driver);

        // Connect the dapp
        await driver.clickElement('#connectButton');
        await driver.delay(regularDelayMs);
        await driver.waitUntilXWindowHandles(3);
        await switchToNotificationWindow(driver);
        await driver.clickElement({
          text: 'Next',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        //
        // TODO: Somehow, some way, open the popup
        //
        // driver.navigate(PAGES.POPUP, 'tab=0');
        // await driver.execute()
        await driver.waitForSelector('#xx');

        // Create and switch to account 2
        await driver.waitForSelector('[data-testid="account-menu-icon"]');
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-account"]',
        );
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // Ensure toast is displaying and connects account when clicked
        const connectSelector = {
          text: 'Connect account',
          tag: '.toasts-container button',
        };
        await driver.waitForSelector(connectSelector);
        await driver.clickElement(connectSelector);

        // Ensure the account tooltip is displaying and correct connection color
        await driver.waitForSelector(
          'div[data-original-title="Account 2 connected"]',
        );
        await driver.waitForSelector(
          '.multichain-connected-site-menu__badge.mm-box--background-color-success-default',
        );

        // TEMPORARY: KEEP TEST OPEN
        await driver.clickElement('#xx');
      },
    );
  });
});
