import { Driver } from '../../webdriver/driver';
import { TestDappBitcoin } from '../pages/test-dapp-bitcoin';
import { WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';

/**
 * Connects the Bitcoin test dapp to the wallet.
 *
 * @param driver
 * @param testDapp
 * @param options
 * @param options.selectAllAccounts
 * @param options.includeDevnet
 * @param options.onboard
 */
export const connectBitcoinTestDapp = async (
    driver: Driver,
    testDapp: TestDappBitcoin,
    options: {
      onboard?: boolean;
      selectAllAccounts?: boolean;
      includeDevnet?: boolean;
      connectionLibrary?: 'sats-connect' | 'wallet-standard';
    } = {},
  ): Promise<void> => {
    console.log('connect bitcoin test dapp');
    await testDapp.checkPageIsLoaded();
    await testDapp.connectToWallet(options.connectionLibrary);
  
    // Get to extension modal, and click on the "Connect" button
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  
    const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
    await connectAccountConfirmation.checkPageIsLoaded();
    await connectAccountConfirmation.confirmConnect();
  
    // Go back to the test dapp window
    await testDapp.switchTo();
    console.log('bitcoin test dapp connected');
  };