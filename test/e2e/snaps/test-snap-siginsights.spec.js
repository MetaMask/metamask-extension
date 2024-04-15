const {
  withFixtures,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Signature Insights', function () {
  it('tests Signature Insights functionality', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        failOnConsoleError: false,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);

        // navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);

        // find and scroll to the transaction-insights test and connect
        const snapButton1 = await driver.findElement(
          '#connectsignature-insights',
        );
        await driver.scrollToElement(snapButton1);
        await driver.delay(1000);
        await driver.clickElement('#connectsignature-insights');
        await driver.delay(1000);

        // switch to metamask extension and click connect
        let windowHandles = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Install' });

        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch to test-snaps page
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // open the test-dapp page
        await openDapp(driver);

        // poll windowHandles and switch to test-dapp
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        // wait for and click use flask
        await driver.waitForSelector({
          text: 'Use MetaMask Flask',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Use MetaMask Flask',
          tag: 'button',
        });

        // find and scroll to basic actions and click connect
        const connectButton1 = await driver.findElement('#connectButton');
        await driver.scrollToElement(connectButton1);
        await driver.clickElement('#connectButton');

        // switch back to MetaMask window and deal with dialogs
        windowHandles = await driver.waitUntilXWindowHandles(4, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.clickElement({
          text: 'Next',
          tag: 'button',
        });
        await driver.delay(1000);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // switch to test-dapp page and send tx
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        // TEST ONE: personal sign
        // find and scroll to personal sign and click sign
        const personalSignButton1 = await driver.findElement('#personalSign');
        await driver.scrollToElement(personalSignButton1);
        await driver.clickElement('#personalSign');

        // switch back to MetaMask window and switch to tx insights pane
        windowHandles = await driver.waitUntilXWindowHandles(4, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // wait for and click sign
        await driver.waitForSelector({
          text: 'Sign',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Sign',
          tag: 'button',
        });

        // look for returned signature insights data
        await driver.waitForSelector({
          text: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
          tag: 'p',
        });

        // click checkbox to authorize signing
        await driver.clickElement('.mm-checkbox__input-wrapper');

        // click sign button
        await driver.clickElement('[data-testid="snapInsightsButtonConfirm"]');

        // switch back to test-dapp window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        // check result of test
        await driver.waitForSelector({
          text: '0xa10b6707dd79e2f1f91ba243ab7abe15a46f58b052ad9cec170c5366ef5667c447a87eba2c0a9d4c9fbfa0a23e9db1fb55865d0568c32bd7cc681b8d0860e7af1b',
          tag: 'span',
        });

        // TEST TWO: sign typed data
        // find and scroll to sign typed data and click sign
        const signTypedButton1 = await driver.findElement('#signTypedData');
        await driver.scrollToElement(signTypedButton1);
        await driver.clickElement('#signTypedData');

        // switch back to MetaMask window and switch to tx insights pane
        windowHandles = await driver.waitUntilXWindowHandles(4, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // wait for and click sign
        await driver.waitForSelector({
          text: 'Sign',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Sign',
          tag: 'button',
        });

        // look for returned signature insights data
        await driver.waitForSelector({
          text: '1',
          tag: 'p',
        });

        // click checkbox to authorize signing
        await driver.clickElement('.mm-checkbox__input-wrapper');

        // click sign button
        await driver.clickElement('[data-testid="snapInsightsButtonConfirm"]');

        // switch back to test-dapp window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        // check result of test
        await driver.waitForSelector({
          text: '0x32791e3c41d40dd5bbfb42e66cf80ca354b0869ae503ad61cd19ba68e11d4f0d2e42a5835b0bfd633596b6a7834ef7d36033633a2479dacfdb96bda360d51f451b',
          tag: 'span',
        });

        // TEST THREE: sign typed data v3
        // find and scroll to sign typed data v3 and click sign
        const signTypedV3Button1 = await driver.findElement('#signTypedDataV3');
        await driver.scrollToElement(signTypedV3Button1);
        await driver.clickElement('#signTypedDataV3');

        // switch back to MetaMask window and switch to tx insights pane
        windowHandles = await driver.waitUntilXWindowHandles(4, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // click down arrow
        await driver.waitForSelector('.fa-arrow-down');
        await driver.clickElement('.fa-arrow-down');

        // wait for and click sign
        await driver.waitForSelector({
          text: 'Sign',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Sign',
          tag: 'button',
        });

        // look for returned signature insights data
        await driver.waitForSelector({
          text: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC has been identified as a malicious verifying contract.',
          tag: 'p',
        });

        // click checkbox to authorize signing
        await driver.clickElement('.mm-checkbox__input-wrapper');

        // click sign button
        await driver.clickElement('[data-testid="snapInsightsButtonConfirm"]');

        // switch back to test-dapp window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        // check result of test
        await driver.waitForSelector({
          text: '0x0a22f7796a2a70c8dc918e7e6eb8452c8f2999d1a1eb5ad714473d36270a40d6724472e5609948c778a07216bd082b60b6f6853d6354c731fd8ccdd3a2f4af261b',
          tag: 'span',
        });

        // TEST FOUR: sign typed data v4
        // find and scroll to sign typed data v4 and click sign
        const signTypedV4Button1 = await driver.findElement('#signTypedDataV4');
        await driver.scrollToElement(signTypedV4Button1);
        await driver.clickElement('#signTypedDataV4');

        // switch back to MetaMask window and switch to tx insights pane
        windowHandles = await driver.waitUntilXWindowHandles(4, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // click down arrow
        await driver.waitForSelector('.fa-arrow-down');
        await driver.clickElement('.fa-arrow-down');

        // wait for and click sign
        await driver.waitForSelector({
          text: 'Sign',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Sign',
          tag: 'button',
        });

        // look for returned signature insights data
        await driver.waitForSelector({
          text: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC has been identified as a malicious verifying contract.',
          tag: 'p',
        });

        // click checkbox to authorize signing
        await driver.clickElement('.mm-checkbox__input-wrapper');

        // click sign button
        await driver.clickElement('[data-testid="snapInsightsButtonConfirm"]');

        // switch back to test-dapp window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        // check results of test
        await driver.waitForSelector({
          text: '0xcd2f9c55840f5e1bcf61812e93c1932485b524ca673b36355482a4fbdf52f692684f92b4f4ab6f6c8572dacce46bd107da154be1c06939b855ecce57a1616ba71b',
          tag: 'span',
        });

        // TEST FIVE: eth_sign
        // switch to metamask window
        const extensionPage = windowHandles[0];
        await driver.switchToWindow(extensionPage);

        // click on the global action menu
        await driver.waitForSelector(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // try to click on the settings item
        await driver.clickElement({
          text: 'Settings',
          tag: 'div',
        });

        // try to click on the advanced item
        await driver.clickElement({
          text: 'Advanced',
          tag: 'div',
        });

        // scroll to and click on Eth_sign requests toggle
        const ethSignToggle1 = await driver.findElement('.eth-sign-toggle');
        await driver.scrollToElement(ethSignToggle1);
        await driver.clickElement('.eth-sign-toggle');

        // wait for and click checkbox on modal and click continue
        await driver.waitForSelector('#eth-sign-checkbox');
        await driver.clickElement('#eth-sign-checkbox');
        await driver.clickElement({
          text: 'Continue',
          tag: 'button',
        });

        // fill in annoyance field and click enable
        await driver.waitForSelector('#enter-eth-sign-text');
        await driver.fill(
          '#enter-eth-sign-text',
          'I only sign what I understand',
        );
        await driver.clickElement({
          text: 'Enable',
          tag: 'button',
        });

        // switch back to test-dapp window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        // scroll to and click eth sign button
        const ethSignButton1 = await driver.findElement('#ethSign');
        await driver.scrollToElement(ethSignButton1);
        await driver.clickElement('#ethSign');

        // switch back to MetaMask window and switch to tx insights pane
        windowHandles = await driver.waitUntilXWindowHandles(4, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // wait for and click sign
        await driver.waitForSelector({
          text: 'Sign',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Sign',
          tag: 'button',
        });

        // wait for and click signature warning sign button
        await driver.waitForSelector(
          '[data-testid="signature-warning-sign-button"]',
        );
        await driver.clickElement(
          '[data-testid="signature-warning-sign-button"]',
        );

        // click checkbox to authorize signing
        await driver.clickElement('.mm-checkbox__input-wrapper');

        // click sign button
        await driver.clickElement('[data-testid="snapInsightsButtonConfirm"]');

        // switch back to test-dapp window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        // check results of test
        await driver.waitForSelector({
          text: '"0x816ab6c5d5356548cc4e004ef35a37fdfab916742a2bbeda756cd064c3d3789a6557d41d49549be1de249e1937a8d048996dfcc70d0552111605dc7cc471e8531b"',
          tag: 'span',
        });
      },
    );
  });
});
