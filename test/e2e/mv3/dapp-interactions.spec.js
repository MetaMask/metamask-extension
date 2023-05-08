const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, openDapp } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('MV3 - Dapp interactions', function () {
  let windowHandles;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
    concurrent: { port: 8546, chainId: 1338 },
  };
  it('should continue to support dapp interactions after service worker re-start', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: {
          ...ganacheOptions,
        },
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);

        // Terminate Service Worker
        await driver.openNewPage('chrome://inspect/#service-workers/');
        await driver.clickElement({
          text: 'Service workers',
          tag: 'button',
        });

        await driver.clickElement({
          text: 'terminate',
          tag: 'span',
        });

        // Trigger Notification
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        const notification = await driver.isElementPresent({
          text: 'Allow this site to add a network?',
          tag: 'h3',
        });

        assert.ok(notification, 'Dapp action does not appear in Metamask');
      },
    );
  });
});
