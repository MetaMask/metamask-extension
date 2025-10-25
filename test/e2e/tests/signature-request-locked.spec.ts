import { WINDOW_TITLES } from '../../helpers';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { Driver } from '../../webdriver/driver';
import TestDapp from '../../page-objects/pages/test-dapp';
import LoginPage from '../../page-objects/pages/login-page';
import PersonalSignConfirmation from '../../page-objects/pages/confirmations/redesign/personal-sign-confirmation';

describe('Signature Requests when Wallet is Locked', function () {
  it('prompts for unlock when personal_sign is called while wallet is locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // Login first to establish connection
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Lock the wallet
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Lock MetaMask', tag: 'button' });

        // Try to sign a message while locked
        await testDapp.clickPersonalSign();

        // Should open unlock popup
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        // After unlock, should show signature confirmation
        const confirmation = new PersonalSignConfirmation(driver);
        await confirmation.verifyConfirmationHeadingTitle();
        await confirmation.clickFooterConfirmButton();

        // Verify signature was successful
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        await driver.waitForSelector({
          css: '#personalSign',
          text: /0x[0-9a-f]{130}/iu,
        });
      },
    );
  });

  it('prompts for unlock when eth_signTypedData_v3 is called while wallet is locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Lock the wallet
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Lock MetaMask', tag: 'button' });

        // Try to sign typed data while locked
        await testDapp.clickSignTypedDataV3();

        // Should open unlock popup
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        // After unlock, should show signature confirmation
        await driver.clickElement('[data-testid="confirm-footer-button"]');

        // Verify signature was successful
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        await driver.waitForSelector({
          css: '#signTypedDataV3Result',
          text: /0x[0-9a-f]{130}/iu,
        });
      },
    );
  });

  it('prompts for unlock when eth_signTypedData_v4 is called while wallet is locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Lock the wallet
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Lock MetaMask', tag: 'button' });

        // Try to sign typed data v4 while locked
        await testDapp.clickSignTypedDataV4();

        // Should open unlock popup
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        // After unlock, should show signature confirmation
        await driver.clickElement('[data-testid="confirm-footer-button"]');

        // Verify signature was successful
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        await driver.waitForSelector({
          css: '#signTypedDataV4Result',
          text: /0x[0-9a-f]{130}/iu,
        });
      },
    );
  });

  it('prompts for unlock when eth_getEncryptionPublicKey is called while wallet is locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Lock the wallet
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Lock MetaMask', tag: 'button' });

        // Try to get encryption public key while locked
        await testDapp.clickGetEncryptionKeyButton();

        // Should open unlock popup
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        // After unlock, should show encryption public key confirmation
        await driver.clickElement('[data-testid="confirm-footer-button"]');

        // Verify encryption public key was returned
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        await driver.waitForSelector({
          css: '#encryptionKeyDisplay',
          text: /^[A-Za-z0-9+/]+=*$/u,
        });
      },
    );
  });

  it('prompts for unlock when eth_decrypt is called while wallet is locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // First get encryption key and encrypt a message
        await testDapp.clickGetEncryptionKeyButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement('[data-testid="confirm-footer-button"]');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();

        await testDapp.clickEncryptButton();

        // Lock the wallet
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Lock MetaMask', tag: 'button' });

        // Try to decrypt while locked
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickDecryptButton();

        // Should open unlock popup
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        // After unlock, should show decrypt confirmation
        await driver.clickElement('[data-testid="confirm-footer-button"]');

        // Verify decryption was successful
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        await driver.waitForSelector({
          css: '#decryptResult',
          text: 'My name is Satoshi Buterin',
        });
      },
    );
  });

  it('does not hang when signature request is rejected after unlock', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Lock the wallet
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Lock MetaMask', tag: 'button' });

        // Try to sign a message while locked
        await testDapp.clickPersonalSign();

        // Unlock
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        // Reject the signature
        const confirmation = new PersonalSignConfirmation(driver);
        await confirmation.verifyConfirmationHeadingTitle();
        await confirmation.clickFooterCancelButton();

        // Verify error is returned to DApp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        await driver.waitForSelector({
          css: '#personalSign',
          text: /User rejected/iu,
        });
      },
    );
  });
});
