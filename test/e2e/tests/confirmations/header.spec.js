const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Header component', function () {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  const SIGNATURE_CONFIRMATIONS = [
    { name: 'Personal Sign signature', testDAppBtnId: 'personalSign' },
    { name: 'Sign Typed Data signature', testDAppBtnId: 'signTypedData' },
    { name: 'Sign Typed Data v3 signature', testDAppBtnId: 'signTypedDataV3' },
    { name: 'Sign Typed Data v4 signature', testDAppBtnId: 'signTypedDataV4' },
    { name: 'Sign Permit signature', testDAppBtnId: 'signPermit' },
  ];

  SIGNATURE_CONFIRMATIONS.forEach((confirmation) => {
    it(`${confirmation.name} component includes header with balance and copyable address element`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: { redesignedConfirmations: true },
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);
          await openDapp(driver);

          const WALLET_ADDRESS = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';

          await clickConfirmationBtnOnTestDapp(
            driver,
            confirmation.testDAppBtnId,
          );
          await clickHeaderInfoBtnAndAssertBalance(driver);
          await copyAddressAndAssertPastedValue(driver, WALLET_ADDRESS);
        },
      );
    });

    async function clickConfirmationBtnOnTestDapp(driver, btnId) {
      await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
      await driver.clickElement(`#${btnId}`);
      await driver.delay(2000);
    }

    async function clickHeaderInfoBtnAndAssertBalance(driver) {
      await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
      const headerInfoButtonEl = await driver.findElement(
        'button[data-testid="header-info-button"]',
      );
      headerInfoButtonEl.click();

      const tokenValue = '25';
      const headerBalanceEl = await driver.findElement(
        '[data-testid="header-balance"]',
      );
      await driver.waitForNonEmptyElement(headerBalanceEl);
      assert.equal(await headerBalanceEl.getText(), `${tokenValue}\nETH`);
    }

    async function copyAddressAndAssertPastedValue(driver, walletAddress) {
      const addressCopyBtnEl = await driver.findElement(
        '[data-testid="address-copy-button-text"]',
      );
      addressCopyBtnEl.click();

      await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
      await driver.findElement('#eip747ContractAddress');
      await driver.pasteFromClipboardIntoField('#eip747ContractAddress');
      const formFieldEl = await driver.findElement('#eip747ContractAddress');
      assert.equal(await formFieldEl.getProperty('value'), walletAddress);
    }
  });
});
