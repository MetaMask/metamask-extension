import { Driver } from '../../webdriver/driver';
import NetworkManager from '../pages/network-manager';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import SendPage from '../pages/send/send-page';
import { TRON_CHAIN_ID } from '../../tests/tron/mocks/common-tron';
import { login } from './login.flow';

export async function landOnTronSendScreen({
  driver,
  symbol,
}: {
  driver: Driver;
  symbol: 'TRX' | 'USDT' | 'USDD' | 'HTX' | 'SEED';
}): Promise<SendPage> {
  await login(driver, { validateBalance: false });
  const networkManager = new NetworkManager(driver);
  await networkManager.openNetworkManager();
  await networkManager.selectTab('Popular');
  await networkManager.selectNetworkByNameWithWait('Tron');

  const home = new NonEvmHomepage(driver);
  await home.checkPageIsLoaded();
  // Wait for the live TRX balance to land on the homepage before navigating to
  // Send. Without this gate, Send opens with the cached "0 TRX available" and
  // every amount renders "Insufficient funds", leaving the Continue button
  // disabled. The local Tron node is seeded with 6.072 TRX in profiles.ts.
  await home.checkExpectedTokenBalanceIsDisplayed('6.072', 'TRX');
  await home.clickOnSendButton();

  const sendPage = new SendPage(driver);
  await sendPage.selectToken(TRON_CHAIN_ID, symbol);
  return sendPage;
}
