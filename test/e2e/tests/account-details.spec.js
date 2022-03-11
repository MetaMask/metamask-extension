const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const LoginPage = require('../page-objects/login.page');
const AccountDetailsMenu = require('../components/account-details-menu');

describe('Show account details', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should show the QR code for the account', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        // Page Objects and Components
        const loginPage = new LoginPage(driver);
        const accountDetailsMenu = new AccountDetailsMenu(driver);

        // Actions and Assertions
        await driver.navigate();
        await loginPage.unlock();
        await accountDetailsMenu.openMenu();
        await accountDetailsMenu.seeAccountDetails();

        const qrCode = await accountDetailsMenu.getQrCode();
        assert.equal(await qrCode.isDisplayed(), true);
      },
    );
  });
});
