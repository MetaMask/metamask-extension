const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');

describe('Swap Eth for another Token', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: 25000000000000000000,
      },
    ],
  };
  it('Completes a Swap between Eth and Matic', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.clickElement(
          '.wallet-overview__buttons .icon-button:nth-child(3)',
        );
        await driver.clickElement(
          '[class*="dropdown-search-list"] + div[class*="MuiFormControl-root MuiTextField-root"]',
        );
        await driver.fill('input[placeholder*="0"]', '2');
        await driver.clickElement(
          '[class*="dropdown-search-list"] + div[class*="MuiFormControl-root MuiTextField-root"]',
        );
        await driver.clickElement(
          '[class="dropdown-search-list__closed-primary-label dropdown-search-list__select-default"]',
        );
        await driver.clickElement('[placeholder="Search for a token"]');
        await driver.clickElement('[placeholder="Search for a token"]');
        await driver.fill('[placeholder="Search for a token"]', 'DAI');
        await driver.waitForSelector(
          '[class="searchable-item-list__primary-label"]',
        );
        await driver.clickElement(
          '[class="searchable-item-list__primary-label"]',
        );
        await driver.clickElement({ text: 'Review Swap', tag: 'button' });
        await driver.waitForSelector('[class*="box--align-items-center"]');
        const estimatedEth = await driver.waitForSelector({
          css: '[class*="box--align-items-center"]',
          text: 'Estimated gas fee',
        });
        assert.equal(await estimatedEth.getText(), 'Estimated gas fee');
        await driver.waitForSelector(
          '[class="exchange-rate-display main-quote-summary__exchange-rate-display"]',
        );
        await driver.waitForSelector(
          '[class="fee-card__info-tooltip-container"]',
        );
        await driver.waitForSelector({
          css: '[class="countdown-timer__time"]',
          text: '0:24',
        });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        const sucessfulTransactionMessage = await driver.waitForSelector({
          css: '[class="awaiting-swap__header"]',
          text: 'Transaction complete',
        });
        assert.equal(
          await sucessfulTransactionMessage.getText(),
          'Transaction complete',
        );
        const sucessfulTransactionToken = await driver.waitForSelector({
          css: '[class="awaiting-swap__amount-and-symbol"]',
          text: 'DAI',
        });
        assert.equal(await sucessfulTransactionToken.getText(), 'DAI');
        await driver.clickElement({ text: 'Close', tag: 'button' });
        await driver.clickElement('[data-testid="home__activity-tab"]');
        const swaptotal = await driver.waitForSelector({
          css: '[class="transaction-list-item__primary-currency"]',
          text: '-2 TESTETH',
        });
        assert.equal(await swaptotal.getText(), '-2 TESTETH');
        const swaptotaltext = await driver.waitForSelector({
          css: '[class="list-item__title"]',
          text: 'Swap TESTETH to DAI',
        });
        assert.equal(await swaptotaltext.getText(), 'Swap TESTETH to DAI');
      },
    );
  });
});
