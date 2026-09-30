import { Driver } from '../../webdriver/driver';
import SwapPage from '../pages/swap/swap-page';
import HomePage from '../pages/home/homepage';

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

export const waitForTransactionToComplete = async (
  driver: Driver,
  options: { tokenName: string },
) => {
  const swapPage = new SwapPage(driver);
  const homePage = new HomePage(driver);

  await swapPage.waitForTransactionCompleteWithToken(options.tokenName);
  await homePage.checkPageIsLoaded();
};
