const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  DAPP_URL,
  defaultGanacheOptions,
  unlockWallet,
  regularDelayMs,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Eth sign', function () {
  it('will detect if eth_sign is disabled', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
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
    const expectedEthSignMessage =
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
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.clickElement('#ethSign');

        // Wait for Signature request popup
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        await verifyAndAssertEthSign(driver, DAPP_URL, expectedEthSignMessage);

        await approveEthSign(
          driver,
          '[data-testid="page-container-footer-next"]',
          '[data-testid="signature-warning-sign-button"]',
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
    const expectedEthSignMessage =
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
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

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
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        await driver.waitForSelector({
          text: 'Reject 2 requests',
          tag: 'button',
        });

        await verifyAndAssertEthSign(driver, DAPP_URL, expectedEthSignMessage);

        // Confirm first eth sign
        await approveEthSign(
          driver,
          '[data-testid="page-container-footer-next"]',
          '[data-testid="signature-warning-sign-button"]',
        );

        // Confirm second eth sign
        await approveEthSign(
          driver,
          '[data-testid="page-container-footer-next"]',
          '[data-testid="signature-warning-sign-button"]',
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

async function verifyAndAssertEthSign(driver, dappUrl, expectedMessage) {
  await driver.findElement({
    css: '.request-signature__content__title',
    text: 'Signature request',
  });

  await driver.findElement({
    css: '.request-signature__origin',
    text: dappUrl,
  });

  await driver.findElement({
    css: '.request-signature__row-value',
    text: expectedMessage,
  });
}

async function approveEthSign(driver, buttonTestId, signButtonClass) {
  await driver.clickElement(buttonTestId);
  await driver.clickElement(signButtonClass);
  await driver.delay(regularDelayMs);
}
