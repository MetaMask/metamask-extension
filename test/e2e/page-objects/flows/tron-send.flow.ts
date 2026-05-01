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
  await home.clickOnSendButton();

  const sendPage = new SendPage(driver);
  await sendPage.selectToken(TRON_CHAIN_ID, symbol);
  return sendPage;
}
