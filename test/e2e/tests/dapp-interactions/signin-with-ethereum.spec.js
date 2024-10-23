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
  it('user should be able to confirm sign in with ethereum', async function () {
    const expectedSigninMessageTitle =
      'This site is requesting to sign in with';
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
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: '.permissions-connect-header__title',
          text: 'Sign-in request',
        });
        await driver.waitForSelector({
          css: '.site-origin',
          text: DAPP_URL,
        });

        await driver.waitForSelector({
          css: '.permissions-connect-header__subtitle',
          text: expectedSigninMessageTitle,
        });
        await driver.findElement({
          css: '.account-list-item__account-name',
          text: 'Account 1',
        });

        // Check the displayed information in popup content
        await driver.waitForSelector({
          tag: 'p',
          text: expectedSigninMessage,
        });

        await driver.waitForSelector({
          tag: 'p',
          text: 'https://127.0.0.1:8080',
        });
        await driver.waitForSelector({
          tag: 'h4',
          text: 'Version:',
        });
        await driver.findElements({
          tag: 'p',
          text: '1',
        });
        await driver.waitForSelector({
          tag: 'h4',
          text: 'Chain ID:',
        });

        // Click on extension popup to approve signin with ethereum
        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="page-container-footer-next"]',
        );

        // Switch back to the dapp and verify the signed result
        await driver.switchToWindowWithTitle('E2E Test Dapp');
        await driver.waitForSelector({
          css: '#siweResult',
          text: expectedSignInResult,
        });
      },
    );
  });
});
