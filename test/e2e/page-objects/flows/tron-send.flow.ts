import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import SendPage from '../pages/send/send-page';
import { TRON_CHAIN_ID } from '../../tests/tron/mocks/common-tron';
import { waitUntilAccountTreeSyncIdle } from './add-account.flow';
import { login } from './login.flow';
import { switchToNetworkFromNetworkSelect } from './network.flow';

/**
 * Opens the Tron send form on the Tron network with the given asset and
 * recipient selected.
 *
 * @param options - Flow options.
 * @param options.driver - The WebDriver instance.
 * @param options.symbol - The asset symbol to send.
 * @param options.recipientAddress - The recipient address.
 * @returns The loaded send page.
 */
export async function openTronSendForm({
  driver,
  symbol,
  recipientAddress,
}: {
  driver: Driver;
  symbol: 'TRX' | 'USDT';
  recipientAddress: string;
}): Promise<SendPage> {
  await login(driver, { validateBalance: false });
  await waitUntilAccountTreeSyncIdle(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Tron');

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.startSendFlow();

  const sendPage = new SendPage(driver);
  await sendPage.selectToken(TRON_CHAIN_ID, symbol);
  await sendPage.checkSendFormIsLoaded();
  await sendPage.fillRecipient({ recipientAddress });

  return sendPage;
}
