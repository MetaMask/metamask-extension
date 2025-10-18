import { WINDOW_TITLES } from '../helpers';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';
import TestDapp from '../page-objects/pages/test-dapp';
import LoginPage from '../page-objects/pages/login-page';
import PersonalSignConfirmation from '../page-objects/pages/confirmations/redesign/personal-sign-confirmation';

describe('personal_sign', function () {
  it('prompts for unlock when the wallet is locked and the requesting origin has permission', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // personal_sign request
        const message =
          '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765';
        const address = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'personal_sign',
          params: [message, address],
          id: 0,
        });

        await driver.executeScript(
          `window.signaturePromise = window.ethereum.request(${request})`,
        );

        // Should open unlock dialog
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        // After unlock, should show signature confirmation
        const confirmation = new PersonalSignConfirmation(driver);
        await confirmation.verifyConfirmationHeadingTitle();
        await confirmation.clickFooterConfirmButton();

        // Verify signature was returned
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();

        const signature = await driver.executeScript(
          'return window.signaturePromise',
        );

        // Signature should be a hex string
        expect(signature).toMatch(/^0x[0-9a-f]{130}$/iu);
      },
    );
  });

  it('can reject signature after unlock', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // personal_sign request
        const message =
          '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765';
        const address = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'personal_sign',
          params: [message, address],
          id: 0,
        });

        await driver.executeScript(
          `window.signaturePromise = window.ethereum.request(${request}).catch(err => err.message)`,
        );

        // Unlock
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        // Reject signature
        const confirmation = new PersonalSignConfirmation(driver);
        await confirmation.verifyConfirmationHeadingTitle();
        await confirmation.clickFooterCancelButton();

        // Verify rejection error was returned
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();

        const result = await driver.executeScript(
          'return window.signaturePromise',
        );

        expect(result).toContain('User rejected');
      },
    );
  });

  it('works correctly when wallet is already unlocked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // Login first
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // personal_sign request while unlocked
        const message =
          '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765';
        const address = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'personal_sign',
          params: [message, address],
          id: 0,
        });

        await driver.executeScript(
          `window.signaturePromise = window.ethereum.request(${request})`,
        );

        // Should NOT show unlock dialog, go straight to signature confirmation
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new PersonalSignConfirmation(driver);
        await confirmation.verifyConfirmationHeadingTitle();
        await confirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();

        const signature = await driver.executeScript(
          'return window.signaturePromise',
        );

        expect(signature).toMatch(/^0x[0-9a-f]{130}$/iu);
      },
    );
  });
});
