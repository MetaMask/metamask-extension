const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  regularDelayMs,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Personal sign', function () {
  it('can initiate and confirm a personal sign', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses[0];
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.clickElement('#personalSign');

        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        const personalMessageRow = await driver.findElement(
          '.request-signature__row-value',
        );
        const personalMessage = await personalMessageRow.getText();
        assert.equal(personalMessage, 'Example `personal_sign` message');

        await driver.clickElement('[data-testid="page-container-footer-next"]');

        await verifyAndAssertPersonalMessage(driver, publicAddress);
      },
    );
  });
  it('can queue multiple personal signs and confirm', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses[0];
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
          'MetaMask Notification',
          windowHandles,
        );

        await driver.waitForSelector({
          text: 'Reject 2 requests',
          tag: 'button',
        });

        const personalMessageRow = await driver.findElement(
          '.request-signature__row-value',
        );
        const personalMessage = await personalMessageRow.getText();
        assert.equal(personalMessage, 'Example `personal_sign` message');

        // Confirm first personal sign
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.delay(regularDelayMs);
        // Confirm second personal sign
        await driver.clickElement('[data-testid="page-container-footer-next"]');

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
