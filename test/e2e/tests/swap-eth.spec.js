const { strict: assert } = require('assert');
const { withFixtures, regularDelayMs } = require('../helpers');

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
  it('Completes a Swap between Eth and Dai', async function () {
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
        await driver.clickElement({
          xpath:
            "//*[contains(text(),'Swap')]/preceding-sibling::div[@class='icon-button__circle']",
        });
        await driver.clickElement({
          xpath:
            "//*[contains(@class,'dropdown-search-list')]/following-sibling::div[contains(@class,'MuiFormControl-root MuiTextField-root')]",
        });
        await driver.fill({ xpath:
          "//input[contains(@placeholder,'0')]",
        },
          '2',
        );
        await driver.clickElement({
          xpath:
            "//*[contains(@class,'dropdown-search-list__closed-primary-label')][contains(text(),'Select a token')]",
        });
        await driver.fill('[placeholder="Search for a token"]','Dai');
        await driver.clickElement({
          xpath:
            "//*[contains(@class,'searchable-item-list__secondary-label')][contains(text(),'Dai')]",
        });
        await driver.delay(.5);
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        const estimatedEth = await driver.waitForSelector({
          css: '[class="fee-card__row-header-text--bold"]',
          text: 'Estimated network fee',
        });
        assert.equal(await estimatedEth.getText(), 'Estimated network fee');
        await driver.delay(5000);
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        const sucessfulTransaction = await driver.waitForSelector({
          css: '[class="awaiting-swap__header"]',
          text: 'Transaction complete',
        });
        assert.equal(await sucessfulTransaction.getText(), 'Transaction complete');
        await driver.clickElement('[data-testid="page-container-footer-next"]');
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


