const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  DAPP_URL,
  defaultGanacheOptions,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Eth sign', function () {
  it('will detect if eth_sign is disabled', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.clickElement('#ethSign');

        await driver.delay(1000);
        const ethSignButton = await driver.findElement('#ethSign');
        const exceptionString =
          'ERROR: ETH_SIGN HAS BEEN DISABLED. YOU MUST ENABLE IT IN THE ADVANCED SETTINGS';
        assert.equal(await ethSignButton.getText(), exceptionString);
      },
    );
  });

  it('can initiate and confirm a eth sign', async function () {
    const expectedPersonalMessage =
      '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0';
    const expectedEthSignResult =
      '"0x816ab6c5d5356548cc4e004ef35a37fdfab916742a2bbeda756cd064c3d3789a6557d41d49549be1de249e1937a8d048996dfcc70d0552111605dc7cc471e8531b"';
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            disabledRpcMethodPreferences: {
              eth_sign: true,
            },
          })
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.clickElement('#ethSign');

        // Wait for Signature request popup
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.findElement({
          css: '.request-signature__content__title',
          text: 'Signature request',
        });

        await driver.findElement({
          css: '.request-signature__origin',
          text: DAPP_URL,
        });

        await driver.findElement({
          css: '.request-signature__row-value',
          text: expectedPersonalMessage,
        });

        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.clickElement(
          '.signature-request-warning__footer__sign-button',
        );
        // Switch to the Dapp
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // Verify
        await driver.findElement({
          css: '#ethSignResult',
          text: expectedEthSignResult,
        });
      },
    );
  });

  it('can queue multiple eth sign and confirm', async function () {
    const expectedPersonalMessage =
      '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0';
    const expectedEthSignResult =
      '"0x816ab6c5d5356548cc4e004ef35a37fdfab916742a2bbeda756cd064c3d3789a6557d41d49549be1de249e1937a8d048996dfcc70d0552111605dc7cc471e8531b"';
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            disabledRpcMethodPreferences: {
              eth_sign: true,
            },
          })
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);
        // Create eth sign
        await driver.clickElement('#ethSign');

        // Wait for Signature request popup
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();

        // Switch to Dapp
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // Create second eth sign
        await driver.clickElement('#ethSign');

        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.waitForSelector({
          text: 'Reject 2 requests',
          tag: 'a',
        });

        const title = await driver.findElement(
          '.request-signature__content__title',
        );
        const origin = await driver.findElement('.request-signature__origin');
        assert.equal(await title.getText(), 'Signature request');
        assert.equal(await origin.getText(), DAPP_URL);

        const personalMessageRow = await driver.findElement(
          '.request-signature__row-value',
        );
        const personalMessage = await personalMessageRow.getText();
        assert.equal(personalMessage, expectedPersonalMessage);

        // Confirm first eth sign
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.clickElement(
          '.signature-request-warning__footer__sign-button',
        );
        // Confirm second eth sign
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.clickElement(
          '.signature-request-warning__footer__sign-button',
        );
        // Switch to the Dapp
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // Verify last confirmed request
        const result = await driver.findElement('#ethSignResult');
        assert.equal(await result.getText(), expectedEthSignResult);
      },
    );
  });
});
