import { strict as assert } from 'assert';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { WINDOW_TITLES } from '../../constants';
import { veryLargeDelayMs } from '../../helpers';
import { withSolanaAccountSnap } from '../../tests/solana/common-solana';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import {
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';

describe('Solana Wallet Standard - Wallet Popup on Request', function () {
  describe('When wallet is locked and dapp requests confirmation', function () {
    it('Should show unlock popup when sign message is requested while wallet is locked', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const messageToSign = 'Hello, world!';
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await connectSolanaTestDapp(driver, testDapp);
          await testDapp.checkPageIsLoaded();

          // Switch to extension and lock the wallet
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.lockMetaMask();

          // Switch back to test dapp and request a signature
          await testDapp.switchTo();
          const signMessageTest = await testDapp.getSignMessageTest();
          await signMessageTest.setMessage(messageToSign);

          // Request sign message - this should trigger the unlock popup
          await signMessageTest.signMessage();

          // Wait for the dialog window to appear (the unlock popup)
          await driver.delay(veryLargeDelayMs);

          // Verify the dialog window appears with the unlock prompt
          // This confirms the unlock popup was triggered automatically
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Verify the unlock password field is present
          const unlockPasswordField = await driver.findElement(
            '[data-testid="unlock-password"]',
          );
          const isDisplayed = await unlockPasswordField.isDisplayed();
          assert.ok(isDisplayed);
        },
      );
    });
  });
});
