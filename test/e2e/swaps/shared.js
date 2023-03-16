const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const { regularDelayMs, veryLargeDelayMs } = require('../helpers');

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

const loadExtension = async (driver) => {
  await driver.navigate();
  await driver.fill('#password', 'correct horse battery staple');
  await driver.press('#password', driver.Key.ENTER);
};

const buildQuote = async (driver, options) => {
  await driver.clickElement(
    '.wallet-overview__buttons .icon-button:nth-child(3)',
  );
  await driver.fill('input[placeholder*="0"]', options.amount);
  await driver.delay(veryLargeDelayMs); // Need an extra delay after typing an amount.
  await driver.waitForSelector(
    '[class="dropdown-input-pair dropdown-input-pair__to"]',
  );
  await driver.clickElement('.dropdown-input-pair__to');
  await driver.fill(
    'input[data-testid="search-list-items"]',
    options.swapTo || options.swapToContractAddress,
  );
  await driver.delay(veryLargeDelayMs); // Need an extra delay after typing an amount.
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

const reviewQuote = async (driver, options) => {
  await driver.clickElement({ text: 'Review swap', tag: 'button' });
  await driver.waitForSelector({ text: 'Swap', tag: 'button' });
  await driver.waitForSelector({
    css: '[class*="box--align-items-center"]',
    text: 'Estimated gas fee',
  });
  const sourceValue = await driver.waitForSelector(
    '.main-quote-summary__source-row-value',
  );
  assert.equal(
    await sourceValue.getText(),
    options.amount,
    'Error: Quote has wrong amount',
  );
  const sourceSymbol = await driver.waitForSelector(
    '.main-quote-summary__source-row-symbol',
  );
  assert.equal(
    await sourceSymbol.getText(),
    options.swapFrom,
    'Error: SwapFrom has wrong symbol',
  );
  const swapToSymbol = await driver.waitForSelector(
    '.main-quote-summary__destination-row > span',
  );
  assert.equal(
    await swapToSymbol.getText(),
    options.swapTo,
    'Error: SwapTo has wrong symbol',
  );
  await driver.waitForSelector(
    '[class="exchange-rate-display main-quote-summary__exchange-rate-display"]',
  );
  await driver.waitForSelector('[class="fee-card__info-tooltip-container"]');
  await driver.waitForSelector({
    css: '[class="countdown-timer__time"]',
    text: '0:23',
  });
};

const waitForTransactionToComplete = async (driver, tokenName) => {
  const sucessfulTransactionMessage = await driver.waitForSelector(
    {
      css: '[class="awaiting-swap__header"]',
      text: 'Transaction complete',
    },
    { timeout: 30000 },
  );
  assert.equal(
    await sucessfulTransactionMessage.getText(),
    'Transaction complete',
    'Incorrect transaction message',
  );
  const sucessfulTransactionToken = await driver.waitForSelector({
    css: '[class="awaiting-swap__amount-and-symbol"]',
    text: tokenName,
  });
  assert.equal(
    await sucessfulTransactionToken.getText(),
    tokenName,
    'Incorrect token name',
  );
  await driver.clickElement({ text: 'Close', tag: 'button' });
  await driver.waitForSelector('[data-testid="home__asset-tab"]');
};

const checkActivityTransaction = async (driver, options) => {
  await driver.clickElement('[data-testid="home__activity-tab"]');
  const itemsText = await driver.findElements('.list-item__title');
  assert.equal(
    await itemsText[options.index].getText(),
    `Swap ${options.swapFrom} to ${options.swapTo}`,
    'Title is incorrect',
  );
  const amountValues = await driver.findElements(
    '.transaction-list-item__primary-currency',
  );
  assert.equal(
    await amountValues[options.index].getText(),
    `-${options.amount} ${options.swapFrom}`,
    'Transaction amount is incorrect',
  );
  await itemsText[options.index].click();
  await driver.delay(regularDelayMs);
  const txStatus = await driver.findElement(
    '.transaction-list-item-details__tx-status >div > div:last-child',
  );
  assert.equal(
    await txStatus.getText(),
    `Confirmed`,
    `Transaction status is not 'Confirmed'`,
  );
  const txAmount = await driver.findElement(
    '.transaction-breakdown__value--amount',
  );
  assert.equal(
    await txAmount.getText(),
    `-${options.amount} ${options.swapFrom}`,
    'Transaction breakdown is incorrect',
  );
  await driver.clickElement('[data-testid="popover-close"]');
};

module.exports = {
  withFixturesOptions,
  loadExtension,
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
};
