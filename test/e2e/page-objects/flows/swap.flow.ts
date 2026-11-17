import { Driver } from '../../webdriver/driver';
import BridgeQuotePage from '../pages/bridge/quote-page';
import HomePage from '../pages/home/homepage';

type SwapOptions = {
  amount: number;
  swapTo?: string;
  swapToContractAddress?: string;
  mainnet?: boolean;
};

export const buildQuote = async (driver: Driver, options: SwapOptions) => {
  const homePage = new HomePage(driver);
  const bridgePage = new BridgeQuotePage(driver);

  await homePage.startSwapFlow();
  await bridgePage.enterSwapAmount(options.amount.toString());

  if (options.swapTo && options.mainnet) {
    await bridgePage.checkQuoteIsDisplayed();
  }

  if (options.swapTo) {
    await bridgePage.selectDestToken(options.swapTo);
    return;
  }

  if (options.swapToContractAddress) {
    await bridgePage.selectDestinationTokenByContract(
      options.swapToContractAddress,
    );
  }
};
