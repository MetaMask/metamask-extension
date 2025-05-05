import { Suite } from 'mocha';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import DecryptMessageConfirmation from '../../page-objects/pages/confirmations/redesign/decrypt-message-confirmation';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  decryptMessageAndVerifyResult,
  getEncryptionKeyInDapp,
} from '../../page-objects/flows/encrypt-decrypt.flow';

describe('Encrypt Decrypt', function (this: Suite) {
  const encryptionKey = 'fxYXfCbun026g5zcCQh7Ia+O0urAEVZWLG8H4Jzu7Xs=';
  const message = 'Hello, Bob!';

  it('should decrypt an encrypted message', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        // ------ Get Encryption key ------
        await getEncryptionKeyInDapp(driver, encryptionKey);

        // ------ Encrypt message ------
        await testDapp.encryptMessage(message);

        // ------ Decrypt message and verify the result ------
        await decryptMessageAndVerifyResult(driver, message);

        // ------ Verify decrypted message in Test Dapp ------
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();
        await testDapp.check_decryptedMessage(message);
      },
    );
  });

  it('should encrypt and decrypt multiple messages', async function () {
    const message2 = 'Hello, Alice!';
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        // ------ Get Encryption key ------
        await getEncryptionKeyInDapp(driver, encryptionKey);

        // ------ Encrypt Message 1------
        await testDapp.encryptMessage(message);

        // ------ Decrypt Message 1 on test dapp------
        await testDapp.clickDecryptButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const decryptMessageConfirmation = new DecryptMessageConfirmation(
          driver,
        );
        await decryptMessageConfirmation.check_pageIsLoaded();

        // ------ Encrypt Message 2 ------
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();
        await testDapp.encryptMessage(message2);

        // ------ Decrypt Message 1 on test dapp and verify the result------
        await decryptMessageAndVerifyResult(driver, message);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();
        await testDapp.check_decryptedMessage(message);

        // ------ Decrypt Message 2 on and verify the result------
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await decryptMessageConfirmation.check_pageIsLoaded();
        await decryptMessageConfirmation.clickDecryptMessageButton();
        await decryptMessageConfirmation.check_decryptedMessage(message2);
        await decryptMessageConfirmation.clickToConfirmDecryptMessage();

        // ------ Verify decrypted message 2 in Test Dapp ------
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();
        await testDapp.check_decryptedMessage(message2);
      },
    );
  });
});
