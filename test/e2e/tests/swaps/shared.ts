import { strict as assert } from 'assert';
import { MockttpServer } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { SWAP_TEST_ETH_DAI_TRADES_MOCK } from '../../../data/mock-data';
import { SWAP_TEST_GAS_INCLUDED_TRADES_MOCK } from '../smart-transactions/mocks';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';

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
  const homePage = new HomePage(driver);
  const swapPage = new SwapPage(driver);

  await homePage.startSwapFlow();
  await swapPage.fillSwapAmount(options.amount.toString());

  if (options.swapTo && options.mainnet) {
    await swapPage.checkQuoteIsDisplayed();
  }

  if (options.swapTo) {
    await swapPage.selectDestinationToken(options.swapTo);
    return;
  }

  if (options.swapToContractAddress) {
    await swapPage.selectDestinationTokenByContract(
      options.swapToContractAddress,
    );
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
  const swapPage = new SwapPage(driver);

  await swapPage.checkQuoteIsDisplayed();
  await swapPage.checkSourceToken(options.swapFrom);
  await swapPage.checkDestinationToken(options.swapTo);

  const swapFromAmount = await swapPage.getFromAmountValue();
  assert.equal(swapFromAmount, options.amount.toString());

  const swapToAmount = await swapPage.getToAmountValue();
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
  const swapPage = new SwapPage(driver);
  const homePage = new HomePage(driver);

  await swapPage.waitForTransactionCompleteWithToken(options.tokenName);
  await homePage.checkPageIsLoaded();
};

export const checkActivityTransaction = async (
  driver: Driver,
  options: { index: number; swapFrom: string; swapTo: string; amount: string },
) => {
  const activityListPage = new ActivityListPage(driver);
  await activityListPage.checkSwapActivityTransaction({
    swapFrom: options.swapFrom,
    swapTo: options.swapTo,
    amount: options.amount,
  });
};

export const checkNotification = async (
  driver: Driver,
  options: { title: string; text: string },
) => {
  const swapPage = new SwapPage(driver);
  await swapPage.checkNotificationBanner(options.title, options.text);
};

export const changeExchangeRate = async (driver: Driver) => {
  const swapPage = new SwapPage(driver);
  await swapPage.selectAlternativeQuote();
};
