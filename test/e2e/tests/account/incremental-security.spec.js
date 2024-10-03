const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, openDapp } = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

const WALLET_PASSWORD = 'correct horse battery staple';

describe('Incremental Security', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x250F458997A364988956409A164BA4E16F0F99F916ACDD73ADCD3A1DE30CF8D1',
        balance: convertToHexValue(0),
      },
      {
        secretKey:
          '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('Back up Secret Recovery Phrase from backup reminder @no-mmi', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions,
        title: this.test.fullTitle(),
        dappPath: 'send-eth-with-private-key-test',
      },
      async ({ driver }) => {
        await driver.navigate();
        // agree to terms of use
        await driver.clickElement('[data-testid="onboarding-terms-checkbox"]');

        // welcome
        await driver.clickElement('[data-testid="onboarding-create-wallet"]');

        // metrics
        await driver.clickElement('[data-testid="metametrics-no-thanks"]');

        // create password
        await driver.fill(
          '[data-testid="create-password-new"]',
          'correct horse battery staple',
        );
        await driver.fill(
          '[data-testid="create-password-confirm"]',
          'correct horse battery staple',
        );
        await driver.clickElement('[data-testid="create-password-terms"]');
        await driver.clickElement('[data-testid="create-password-wallet"]');

        // secure wallet later
        await driver.clickElement('[data-testid="secure-wallet-later"]');
        await driver.clickElement(
          '[data-testid="skip-srp-backup-popover-checkbox"]',
        );
        await driver.clickElement('[data-testid="skip-srp-backup"]');

        // complete
        await driver.clickElement('[data-testid="onboarding-complete-done"]');

        // pin extension
        await driver.clickElement('[data-testid="pin-extension-next"]');
        await driver.clickElement('[data-testid="pin-extension-done"]');

        // open account menu
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-details"');

        const outerSegment = await driver.findElement(
          '.qr-code__address-segments',
        );
        const publicAddress = await outerSegment.getText();

        // wait for account modal to be visible
        await driver.findVisibleElement(
          '[data-testid="account-details-modal"]',
        );
        await driver.clickElement('button[aria-label="Close"]');

        // wait for account modal to be removed from DOM
        await driver.assertElementNotPresent(
          '[data-testid="account-details-modal"]',
        );

        // send to current account from dapp with different provider
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];

        // switched to Dapp
        await openDapp(driver);

        // sends eth to the current account
        await driver.fill('#address', publicAddress);
        await driver.clickElement('#send');

        await driver.waitForSelector(
          { css: '#success', text: 'Success' },
          { timeout: 15000 },
        );

        // switch to extension
        await driver.switchToWindow(extension);

        // should have the correct amount of eth
        let currencyDisplay = await driver.waitForSelector({
          css: '.currency-display-component__text',
          text: '1',
        });
        let balance = await currencyDisplay.getText();
        assert.strictEqual(balance, '1');

        // backs up the Secret Recovery Phrase
        // should show a backup reminder
        const backupReminder = await driver.findElements({
          xpath:
            "//div[contains(@class, 'home-notification__text') and contains(text(), 'Back up your Secret Recovery Phrase to keep your wallet and funds secure')]",
        });
        assert.equal(backupReminder.length, 1);

        // should take the user to the seedphrase backup screen
        await driver.clickElement('.home-notification__accept-button');

        // reveals the Secret Recovery Phrase
        await driver.clickElement('[data-testid="secure-wallet-recommended"]');

        await driver.fill('[placeholder="Password"]', WALLET_PASSWORD);

        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.assertElementNotPresent(
          '[data-testid="reveal-srp-modal"]',
        );

        const recoveryPhraseRevealButton = await driver.findClickableElement(
          '[data-testid="recovery-phrase-reveal"]',
        );
        await recoveryPhraseRevealButton.click();

        const chipTwo = await (
          await driver.findElement('[data-testid="recovery-phrase-chip-2"]')
        ).getText();
        const chipThree = await (
          await driver.findElement('[data-testid="recovery-phrase-chip-3"]')
        ).getText();
        const chipSeven = await (
          await driver.findElement('[data-testid="recovery-phrase-chip-7"]')
        ).getText();
        await driver.clickElement('[data-testid="recovery-phrase-next"]');

        // can retype the Secret Recovery Phrase
        await driver.fill('[data-testid="recovery-phrase-input-2"]', chipTwo);
        await driver.fill('[data-testid="recovery-phrase-input-3"]', chipThree);
        await driver.fill('[data-testid="recovery-phrase-input-7"]', chipSeven);
        await driver.clickElement('[data-testid="recovery-phrase-confirm"]');

        // should have the correct amount of eth
        currencyDisplay = await driver.waitForSelector({
          css: '.currency-display-component__text',
          text: '1',
        });
        balance = await currencyDisplay.getText();

        assert.strictEqual(balance, '1');

        // The previous currencyDisplay wait already serves as the guard here for the assertElementNotPresent
        await driver.assertElementNotPresent('.backup-notification');
      },
    );
  });
});
