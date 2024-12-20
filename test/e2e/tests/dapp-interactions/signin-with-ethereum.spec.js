const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  DAPP_URL,
  tempToggleSettingRedesignedConfirmations,
  unlockWallet,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Sign in with ethereum', function () {
  describe('Old confirmation screens', function () {
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
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);
          await tempToggleSettingRedesignedConfirmations(driver);

          // Create a signin with ethereum request in test dapp
          await openDapp(driver);
          await driver.clickElement('#siwe');

          // Wait for signature request popup and check the message title
          await driver.waitUntilXWindowHandles(3);
          let windowHandles = await driver.getAllWindowHandles();
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.Dialog,
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
          await driver.clickElement(
            '[data-testid="page-container-footer-next"]',
          );
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

  describe('Redesigned confirmation screens', function () {
    it('user should be able to confirm sign in with ethereum', async function () {
      const expectedSigninMessageTitle =
        'A site wants you to sign in to prove you own this account.';
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
          ganacheOptions: defaultGanacheOptions,
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
            WINDOW_TITLES.Dialog,
            windowHandles,
          );
          await driver.findElement({
            css: 'h2',
            text: 'Sign-in request',
          });
          await driver.findElement({
            css: 'p',
            text: expectedSigninMessageTitle,
          });
          await driver.findElement({
            css: 'p',
            text: '127.0.0.1:8080',
          });

          await driver.clickElement('[data-testid="sectionCollapseButton"]');

          // Check the displayed information in popup content
          await driver.findElement({
            css: 'p',
            text: expectedSigninMessage,
          });
          await driver.findElement({
            css: 'p',
            text: 'https://127.0.0.1:8080',
          });
          await driver.findElement({
            css: 'p',
            text: '1',
          });
          await driver.findElement({
            css: 'p',
            text: '1',
          });

          await driver.clickElement({
            css: 'button',
            text: 'Confirm',
          });

          // Switch back to the dapp and verify the signed result
          windowHandles = await driver.getAllWindowHandles();
          await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
          const result = await driver.findElement('#siweResult');
          assert.equal(await result.getText(), expectedSignInResult);
        },
      );
    });
  });
});
