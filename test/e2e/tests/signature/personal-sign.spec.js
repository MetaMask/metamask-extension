const { strict: assert } = require('assert');
const { By } = require('selenium-webdriver');
const {
  withFixtures,
  openDapp,
  regularDelayMs,
  unlockWallet,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Personal sign', function () {
  it('can queue multiple personal signs and confirm', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        const addresses = await localNodes[0].getAccounts();
        const publicAddress = addresses[0].toLowerCase();
        await unlockWallet(driver);

        await openDapp(driver);
        // Create personal sign
        await driver.clickElement('#personalSign');

        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();

        // Switch to Dapp
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // Create second personal sign
        await driver.clickElement('#personalSign');

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        await driver.waitForSelector(
          By.xpath("//p[normalize-space(.)='1 of 2']"),
        );

        await driver.waitForSelector({
          text: 'Reject all',
          tag: 'button',
        });

        await driver.findElement({
          css: 'p',
          text: 'Example `personal_sign` message',
        });

        // Confirm first personal sign
        await driver.clickElement('[data-testid="confirm-footer-button"]');
        await driver.delay(regularDelayMs);
        // Confirm second personal sign
        await driver.clickElement('[data-testid="confirm-footer-button"]');

        await verifyAndAssertPersonalMessage(driver, publicAddress);
      },
    );
  });
});

async function verifyAndAssertPersonalMessage(driver, publicAddress) {
  // Switch to the Dapp
  await driver.waitUntilXWindowHandles(2);
  const windowHandles = await driver.getAllWindowHandles();
  await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

  // Verify last confirmed personal sign
  await driver.clickElement('#personalSignVerify');
  const verifySigUtil = await driver.findElement(
    '#personalSignVerifySigUtilResult',
  );
  const verifyECRecover = await driver.waitForSelector({
    css: '#personalSignVerifyECRecoverResult',
    text: publicAddress,
  });
  assert.equal(await verifySigUtil.getText(), publicAddress);
  assert.equal(await verifyECRecover.getText(), publicAddress);
}
