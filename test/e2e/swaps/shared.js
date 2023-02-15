const { strict: assert } = require('assert');

const FixtureBuilder = require('../fixture-builder');
const { veryLargeDelayMs } = require('../helpers');

const ganacheOptions = {
  accounts: [
    {
      secretKey:
        '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
      balance: 25000000000000000000,
    },
  ],
};

const withFixturesOptions = {
  fixtures: new FixtureBuilder().build(),
  ganacheOptions,
};

const loginExtension = async (driver) => {
  await driver.navigate();
  await driver.fill('#password', 'correct horse battery staple');
  await driver.press('#password', driver.Key.ENTER);
};

const enterSwapQuote = async (driver, options) => {
  await driver.clickElement(
    '.wallet-overview__buttons .icon-button:nth-child(3)',
  );
  await driver.fill('input[placeholder*="0"]', options.amount);
  await driver.delay(veryLargeDelayMs); // Need an extra delay after typing an amount.
  await driver.clickElement(
    '[class="dropdown-search-list__closed-primary-label dropdown-search-list__select-default"]',
  );
  await driver.wait(async () => {
    const tokens = await driver.findElements('.searchable-item-list__item');
    return tokens.length > 1;
  });
  await driver.clickElement('.searchable-item-list__labels');
  await driver.clickElement('.dropdown-input-pair__to');
  await driver.clickElement('input[data-testid="search-list-items"]');
  await driver.fill(
    'input[data-testid="search-list-items"]',
    options.swapTo || options.swapToContractAddress,
  );
  if (options.swapTo) {
    await driver.wait(async () => {
      const tokenNames = await driver.findElements(
        '.searchable-item-list__primary-label',
      );
      if (tokenNames.length === 0) {
        return false;
      }
      const tokenName = await tokenNames[0].getText();
      return tokenName === options.swapTo;
    });
  }
  if (options.swapToContractAddress) {
    await driver.waitForSelector({
      css: '.searchable-item-list__item button.btn-primary',
      text: 'Import',
    });
  }
  await driver.clickElement('.searchable-item-list__primary-label');
};

const reviewQuote = async (driver) => {

  do {
    await driver.delay(10000)
    await driver.clickElement({ text: 'Review swap', tag: 'button' });
  } while (!await driver.executeScript(`return document.querySelector('.main-quote-summary__quote-large-number')`))

  await driver.waitForSelector({
    css: '[class*="box--align-items-center"]',
    text: 'Estimated gas fee',
  });

  await driver.waitForSelector(
    '[class="exchange-rate-display main-quote-summary__exchange-rate-display"]',
  );
  await driver.waitForSelector(
    '[class="fee-card__info-tooltip-container"]',
  );
};

const waitForTransactionToComplete = async (driver, tokenName) => {
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
    text: tokenName,
  });
  assert.equal(await sucessfulTransactionToken.getText(), tokenName);
  await driver.clickElement({ text: 'Close', tag: 'button' });
};

module.exports = {
  withFixturesOptions,
  loginExtension,
  enterSwapQuote,
  reviewQuote,
  waitForTransactionToComplete,
};
