import { Driver } from '../../webdriver/driver';
import SwapPage from '../pages/swap/swap-page';
import HomePage from '../pages/home/homepage';
import {
  selectDestinationToken,
  selectDestinationTokenByContract,
} from './bridge.flow';

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
  await swapPage.enterSwapAmount(options.amount.toString());

  if (options.swapTo && options.mainnet) {
    await swapPage.checkQuoteIsDisplayed();
  }

  if (options.swapTo) {
    await selectDestinationToken(driver, options.swapTo);
    return;
  }

  if (options.swapToContractAddress) {
    await selectDestinationTokenByContract(
      driver,
      options.swapToContractAddress,
    );
  }
};
