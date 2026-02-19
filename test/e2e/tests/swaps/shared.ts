import { strict as assert } from 'assert';
import { MockttpServer } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { regularDelayMs } from '../../helpers';
import { SWAP_TEST_ETH_DAI_TRADES_MOCK } from '../../../data/mock-data';
import { SWAP_TEST_GAS_INCLUDED_TRADES_MOCK } from '../smart-transactions/mocks';

export async function mockEthDaiTrade(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: SWAP_TEST_ETH_DAI_TRADES_MOCK,
        };
      }),
  ];
}

export async function mockEthUsdcGasIncludedTrade(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/1/trades')
      .withQuery({ enableGasIncludedQuotes: 'true' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: SWAP_TEST_GAS_INCLUDED_TRADES_MOCK,
        };
      }),
  ];
}

type SwapOptions = {
  amount: number;
  swapTo?: string;
  swapToContractAddress?: string;
  mainnet?: boolean;
};

export const buildQuote = async (driver: Driver, options: SwapOptions) => {
  await driver.clickElement('[data-testid="eth-overview-swap"]');
  await driver.waitForSelector('[data-testid="from-amount"]');
  await driver.fill(
    'input[data-testid="from-amount"]',
    options.amount.toString(),
  );

  if (options.swapTo && options.mainnet) {
    await driver.waitForSelector({
      css: '[data-testid="network-fees"]',
    });
  }

  await driver.clickElement('[data-testid="bridge-destination-button"]');
  await driver.waitForSelector(
    '[data-testid="bridge-asset-picker-search-input"]',
  );

  await driver.fill(
    'input[data-testid="bridge-asset-picker-search-input"]',
    options.swapTo || options.swapToContractAddress || '',
  );

  if (options.swapTo) {
    await driver.waitForSelector({
      css: '[data-testid="bridge-asset"]',
      text: options.swapTo,
    });
    await driver.clickElement({
      css: '[data-testid="bridge-asset"]',
      text: options.swapTo,
    });
    return;
  }

  if (options.swapToContractAddress) {
    await driver.wait(async () => {
      const hasImportButton = await driver.isElementPresent({
        css: '[data-testid="import-tokens-import-button"]',
      });
      const hasBridgeAsset = await driver.isElementPresent({
        css: '[data-testid="bridge-asset"]',
      });
      return hasImportButton || hasBridgeAsset;
    });

    const hasImportButton = await driver.isElementPresent({
      css: '[data-testid="import-tokens-import-button"]',
    });

    if (!hasImportButton) {
      await driver.clickElement('[data-testid="bridge-asset"]');
    }
  }
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
  await driver.waitForSelector('[data-testid="bridge-cta-button"]');
  await driver.waitForMultipleSelectors([
    '[data-testid="network-fees"]',
    '[data-testid="slippage-edit-button"]',
    '[data-testid="minimum-received"]',
  ]);

  await driver.waitForSelector({
    css: '[data-testid="bridge-source-button"]',
    text: options.swapFrom,
  });

  await driver.waitForSelector({
    css: '[data-testid="bridge-destination-button"]',
    text: options.swapTo,
  });

  const elementSwapFromAmount = await driver.findElement(
    'input[data-testid="from-amount"]',
  );
  const swapFromAmount = await elementSwapFromAmount.getAttribute('value');
  assert.equal(swapFromAmount, options.amount.toString());

  const elementSwapToAmount = await driver.findElement(
    'input[data-testid="to-amount"]',
  );
  const swapToAmount = await elementSwapToAmount.getAttribute('value');
  const normalizedSwapToAmount = Number(swapToAmount.replace(/,/gu, ''));
  assert.equal(
    normalizedSwapToAmount > 0,
    true,
    `Expected destination amount to be > 0 but got ${swapToAmount}`,
  );
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

  await driver.waitForSelector({
    tag: 'p',
    text: `Swap ${options.swapFrom} to ${options.swapTo}`,
  });

  await driver.findElement({
    css: '[data-testid="transaction-list-item-primary-currency"]',
    text: `-${options.amount} ${options.swapFrom}`,
  });

  await driver.clickElement({
    tag: 'p',
    text: `Swap ${options.swapFrom} to ${options.swapTo}`,
  });
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
      css: '.mm-banner-base',
      text: options.text,
    });

  assert.equal(
    isExpectedBoxContentPresentAndVisible,
    true,
    'Invalid box text content',
  );
};

export const changeExchangeRate = async (driver: Driver) => {
  await driver.waitForSelector('[aria-label="More quotes"]');
  await driver.clickElement('[aria-label="More quotes"]');
  await driver.waitForSelector({
    text: 'Select a quote',
  });

  await driver.executeScript(`
    const quoteRows = Array.from(
      document.querySelectorAll('.quotes-modal [style*="position: relative"]'),
    );
    if (quoteRows.length === 0) {
      throw new Error('No quotes available to select');
    }

    const targetRow = quoteRows[Math.min(1, quoteRows.length - 1)];
    targetRow.scrollIntoView({ block: 'center' });
    targetRow.click();
  `);

  await driver.assertElementNotPresent('.quotes-modal');
};
