import { strict as assert } from 'assert';
import { ServerOptions } from 'ganache';
import { MockttpServer } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { regularDelayMs, veryLargeDelayMs } from '../../helpers';
import { SWAP_TEST_ETH_DAI_TRADES_MOCK } from '../../../data/mock-data';

export async function mockEthDaiTrade(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: SWAP_TEST_ETH_DAI_TRADES_MOCK,
        };
      }),
  ];
}

export const ganacheOptions: ServerOptions & { miner: { blockTime?: number } } =
  {
    wallet: {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000n,
        },
      ],
    },
    miner: {},
  };

export const withFixturesOptions = {
  fixtures: new FixtureBuilder().build(),
  ganacheOptions,
};

type SwapOptions = {
  amount: number;
  swapTo?: string;
  swapToContractAddress?: string;
};

export const buildQuote = async (driver: Driver, options: SwapOptions) => {
  await driver.clickElement('[data-testid="token-overview-button-swap"]');
  await driver.fill(
    'input[data-testid="prepare-swap-page-from-token-amount"]',
    options.amount.toString(),
  );
  await driver.delay(veryLargeDelayMs); // Need an extra delay after typing an amount.
  await driver.clickElement('[data-testid="prepare-swap-page-swap-to"]');
  await driver.waitForSelector('[id="list-with-search__text-search"]');

  await driver.fill(
    'input[id="list-with-search__text-search"]',
    options.swapTo || options.swapToContractAddress || '',
  );

  await driver.delay(veryLargeDelayMs); // Need an extra delay after typing an amount.
  if (options.swapTo) {
    await driver.wait(async () => {
      const tokenNames = await driver.findElements(
        '[data-testid="searchable-item-list-primary-label"]',
      );
      if (tokenNames.length === 0) {
        return false;
      }
      const tokenName = await tokenNames[0].getText();
      return tokenName === options.swapTo;
    });
  }
  if (options.swapToContractAddress) {
    await driver.waitForSelector(
      '[data-testid="searchable-item-list-import-button"]',
    );
  }
  await driver.clickElement(
    '[data-testid="searchable-item-list-primary-label"]',
  );
};

export const reviewQuote = async (
  driver: Driver,
  options: {
    swapFrom: string;
    swapTo: string;
    amount: number;
    skipCounter?: boolean;
  },
) => {
  const summary = await driver.waitForSelector(
    '[data-testid="exchange-rate-display-quote-rate"]',
  );
  const summaryText = await summary.getText();
  console.log('============\nsummaryText\n============', {
    summaryText,
    options,
  });
  assert.equal(summaryText.includes(options.swapFrom), true);
  assert.equal(summaryText.includes(options.swapTo), true);
  const quote = summaryText.split(`\n`);

  const elementSwapToAmount = await driver.findElement(
    '[data-testid="prepare-swap-page-receive-amount"]',
  );
  const swapToAmount = await elementSwapToAmount.getText();
  const expectedAmount = Number(quote[3]) * options.amount;
  const dotIndex = swapToAmount.indexOf('.');
  const decimals = dotIndex === -1 ? 0 : swapToAmount.length - dotIndex - 1;
  assert.equal(
    swapToAmount,
    expectedAmount.toFixed(decimals),
    `Expecting ${expectedAmount.toFixed(
      decimals,
    )} but got ${swapToAmount} instead`,
  );

  await driver.findElement('[data-testid="review-quote-gas-fee-in-fiat"]');

  await driver.findElement('[data-testid="info-tooltip"]');

  if (!options.skipCounter) {
    await driver.waitForSelector({
      css: '[data-testid="countdown-timer__timer-container"]',
      text: '0:25',
    });
  }
};

export const waitForTransactionToComplete = async (
  driver: Driver,
  options: { tokenName: string },
) => {
  await driver.waitForSelector({
    css: '[data-testid="awaiting-swap-header"]',
    text: 'Processing',
  });

  await driver.waitForSelector(
    {
      css: '[data-testid="awaiting-swap-header"]',
      text: 'Transaction complete',
    },
    { timeout: 30000 },
  );

  await driver.findElement({
    css: '[data-testid="awaiting-swap-main-description"]',
    text: `${options.tokenName}`,
  });

  await driver.clickElement({ text: 'Close', tag: 'button' });
  await driver.waitForSelector('[data-testid="account-overview__asset-tab"]');
};

export const checkActivityTransaction = async (
  driver: Driver,
  options: { index: number; swapFrom: string; swapTo: string; amount: string },
) => {
  await driver.clickElement('[data-testid="account-overview__activity-tab"]');
  await driver.waitForSelector('.activity-list-item');

  const transactionList = await driver.findElements(
    '[data-testid="activity-list-item-action"]',
  );
  const transactionText = await transactionList[options.index].getText();
  assert.equal(
    transactionText,
    `Swap ${options.swapFrom} to ${options.swapTo}`,
    'Transaction not found',
  );

  await driver.findElement({
    css: '[data-testid="transaction-list-item-primary-currency"]',
    text: `-${options.amount} ${options.swapFrom}`,
  });

  await transactionList[options.index].click();
  await driver.delay(regularDelayMs);

  await driver.findElement({
    css: '.transaction-status-label',
    text: 'Confirmed',
  });

  await driver.findElement({
    css: '[data-testid="transaction-breakdown-value-amount"]',
    text: `-${options.amount} ${options.swapFrom}`,
  });

  await driver.clickElement('[data-testid="popover-close"]');
};

export const checkNotification = async (
  driver: Driver,
  options: { title: string; text: string },
) => {
  const isExpectedBoxTitlePresentAndVisible =
    await driver.isElementPresentAndVisible({
      css: '[data-testid="swaps-banner-title"]',
      text: options.title,
    });

  assert.equal(isExpectedBoxTitlePresentAndVisible, true, 'Invalid box title');

  const isExpectedBoxContentPresentAndVisible =
    await driver.isElementPresentAndVisible({
      css: '[data-testid="mm-banner-alert-notification-text"]',
      text: options.text,
    });

  assert.equal(
    isExpectedBoxContentPresentAndVisible,
    true,
    'Invalid box text content',
  );
};

export const changeExchangeRate = async (driver: Driver) => {
  await driver.clickElement('[data-testid="review-quote-view-all-quotes"]');
  await driver.waitForSelector({ text: 'Quote details', tag: 'h2' });

  const networkFees = await driver.findElements(
    '[data-testid*="select-quote-popover-row"]',
  );
  const random = Math.floor(Math.random() * networkFees.length);
  await networkFees[random].click();
  await driver.clickElement({ text: 'Select', tag: 'button' });
};
