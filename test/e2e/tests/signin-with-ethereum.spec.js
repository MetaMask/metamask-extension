const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  DAPP_URL,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Sign in with ethereum', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('user should be able to confirm sign in with ethereum', async function () {
    const expectedSigninMessageTitle =
      'This site is requesting to sign in with Account 1';
    const expectedSigninMessage =
      'I accept the MetaMask Terms of Service: https://community.metamask.io/tos';
    const expectedSignInResult =
      '0xef8674a92d62a1876624547bdccaef6c67014ae821de18fa910fbff56577a65830f68848585b33d1f4b9ea1c3da1c1b11553b6aabe8446717daf7cd1e38a68271c';
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: {
          ...ganacheOptions,
        },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Create a signin with ethereum request in test dapp
        await openDapp(driver);
        await driver.clickElement('#siwe');

        // Wait for signature request popup and check the message title
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const title = await driver.findElement(
          '.permissions-connect-header__title',
        );
        const origin = await driver.findElement('.site-origin');
        assert.equal(await title.getText(), 'Sign-in request');
        assert.equal(await origin.getText(), DAPP_URL);

        const displayedMessageTitle = await driver.findElement(
          '.permissions-connect-header__subtitle',
        );
        const account = await driver.findElement(
          '.account-list-item__account-name',
        );
        assert.equal(
          `${await displayedMessageTitle.getText()} ${await account.getText()}`,
          expectedSigninMessageTitle,
        );

        // Check the displayed information in popup content
        const [message, url, version, chainId] = await driver.findElements(
          '.signature-request-siwe-message__sub-text',
        );
        assert.equal(await message.getText(), expectedSigninMessage);
        assert.equal(await url.getText(), 'https://127.0.0.1:8080');
        assert.equal(await version.getText(), '1');
        assert.equal(await chainId.getText(), '1');

        // Click on extension popup to approve signin with ethereum
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.waitUntilXWindowHandles(2);

        // Switch back to the dapp and verify the signed result
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        const result = await driver.findElement('#siweResult');
        assert.equal(await result.getText(), expectedSignInResult);
      },
    );
  });
});
