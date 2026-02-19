import { strict as assert } from 'assert';
import { MockttpServer } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { regularDelayMs } from '../../helpers';
import { SWAP_TEST_ETH_DAI_TRADES_MOCK } from '../../../data/mock-data';
import { SWAP_TEST_GAS_INCLUDED_TRADES_MOCK } from '../smart-transactions/mocks';

const swapButton = '[data-testid="eth-overview-swap"]';
const fromAmount = '[data-testid="from-amount"]';
const fromAmountInput = 'input[data-testid="from-amount"]';
const toAmountInput = 'input[data-testid="to-amount"]';
const networkFees = '[data-testid="network-fees"]';
const bridgeDestinationButton = '[data-testid="bridge-destination-button"]';
const bridgeSourceButton = '[data-testid="bridge-source-button"]';
const assetPickerSearchInput =
  '[data-testid="bridge-asset-picker-search-input"]';
const assetPickerSearchInputField =
  'input[data-testid="bridge-asset-picker-search-input"]';
const bridgeAsset = '[data-testid="bridge-asset"]';
const importTokensButton = '[data-testid="import-tokens-import-button"]';
const bridgeCtaButton = '[data-testid="bridge-cta-button"]';
const slippageEditButton = '[data-testid="slippage-edit-button"]';
const minimumReceived = '[data-testid="minimum-received"]';
const awaitingSwapHeader = '[data-testid="awaiting-swap-header"]';
const awaitingSwapDescription =
  '[data-testid="awaiting-swap-main-description"]';
const assetTab = '[data-testid="account-overview__asset-tab"]';
const activityTab = '[data-testid="account-overview__activity-tab"]';
const primaryCurrency =
  '[data-testid="transaction-list-item-primary-currency"]';
const transactionBreakdownAmount =
  '[data-testid="transaction-breakdown-value-amount"]';
const popoverClose = '[data-testid="popover-close"]';
const swapsBannerTitle = '[data-testid="swaps-banner-title"]';
const moreQuotesButton = '[aria-label="More quotes"]';

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
  await driver.clickElement(swapButton);
  await driver.waitForSelector(fromAmount);
  await driver.fill(fromAmountInput, options.amount.toString());

  if (options.swapTo && options.mainnet) {
    await driver.waitForSelector({ css: networkFees });
  }

  await driver.clickElement(bridgeDestinationButton);
  await driver.waitForSelector(assetPickerSearchInput);

  await driver.fill(
    assetPickerSearchInputField,
    options.swapTo || options.swapToContractAddress || '',
  );

  if (options.swapTo) {
    await driver.waitForSelector({
      css: bridgeAsset,
      text: options.swapTo,
    });
    await driver.clickElement({
      css: bridgeAsset,
      text: options.swapTo,
    });
    return;
  }

  if (options.swapToContractAddress) {
    await driver.wait(async () => {
      const hasImport = await driver.isElementPresent({
        css: importTokensButton,
      });
      const hasAsset = await driver.isElementPresent({
        css: bridgeAsset,
      });
      return hasImport || hasAsset;
    });

    const hasImport = await driver.isElementPresent({
      css: importTokensButton,
    });

    if (hasImport) {
      await driver.clickElement(importTokensButton);
      await driver.waitForSelector({ css: bridgeAsset });
    }
    await driver.clickElement(bridgeAsset);
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
  await driver.waitForSelector(bridgeCtaButton);
  await driver.waitForMultipleSelectors([
    networkFees,
    slippageEditButton,
    minimumReceived,
  ]);

  await driver.waitForSelector({
    css: bridgeSourceButton,
    text: options.swapFrom,
  });

  await driver.waitForSelector({
    css: bridgeDestinationButton,
    text: options.swapTo,
  });

  const elementSwapFromAmount = await driver.findElement(fromAmountInput);
  const swapFromAmount = await elementSwapFromAmount.getAttribute('value');
  assert.equal(swapFromAmount, options.amount.toString());

  const elementSwapToAmount = await driver.findElement(toAmountInput);
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
    css: awaitingSwapHeader,
    text: 'Processing',
  });

  await driver.waitForSelector(
    {
      css: awaitingSwapHeader,
      text: 'Transaction complete',
    },
    { timeout: 30000 },
  );

  await driver.findElement({
    css: awaitingSwapDescription,
    text: `${options.tokenName}`,
  });

  await driver.clickElement({ text: 'Close', tag: 'button' });
  await driver.waitForSelector(assetTab);
};

export const checkActivityTransaction = async (
  driver: Driver,
  options: { index: number; swapFrom: string; swapTo: string; amount: string },
) => {
  await driver.clickElement(activityTab);
  await driver.waitForSelector('.activity-list-item');

  await driver.waitForSelector({
    tag: 'p',
    text: `Swap ${options.swapFrom} to ${options.swapTo}`,
  });

  await driver.findElement({
    css: primaryCurrency,
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
    css: transactionBreakdownAmount,
    text: `-${options.amount} ${options.swapFrom}`,
  });

  await driver.clickElement(popoverClose);
};

export const checkNotification = async (
  driver: Driver,
  options: { title: string; text: string },
) => {
  const isExpectedBoxTitlePresentAndVisible =
    await driver.isElementPresentAndVisible({
      css: swapsBannerTitle,
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
  await driver.waitForSelector(moreQuotesButton);
  await driver.clickElement(moreQuotesButton);
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
