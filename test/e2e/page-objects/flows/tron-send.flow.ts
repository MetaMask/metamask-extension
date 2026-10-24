import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import TokensTab from '../pages/home/tokens-tab';
import SendPage from '../pages/send/send-page';
import { TRON_CHAIN_ID } from '../../tests/tron/mocks/common-tron';
import { login } from './login.flow';
import { TRON_HOMEPAGE_TOKEN_TIMEOUT_MS } from './tron-assets.flow';
import { selectTronNetwork } from './tron-network.flow';
import { waitUntilAccountTreeSyncIdle } from './add-account.flow';

export async function landOnTronSendScreen({
  driver,
  symbol,
  assetId,
  expectedNativeBalance = '6.072',
  expectedTokenBalance,
}: {
  driver: Driver;
  symbol: 'TRX' | 'USDT' | 'USDD' | 'HTX' | 'SEED';
  assetId?: string;
  expectedNativeBalance?: string | null;
  expectedTokenBalance?: string;
}): Promise<SendPage> {
  await login(driver, { validateBalance: false });
  await waitUntilAccountTreeSyncIdle(driver);
  await selectTronNetwork(driver);

  const home = new NonEvmHomepage(driver);
  await home.checkPageIsLoaded();
  const tokensTab = new TokensTab(driver);
  await tokensTab.checkTokenNameVisible('Tron', {
    timeout: TRON_HOMEPAGE_TOKEN_TIMEOUT_MS,
  });
  if (expectedNativeBalance) {
    await home.checkExpectedTokenBalanceIsDisplayed(
      expectedNativeBalance,
      'TRX',
    );
  }
  if (expectedTokenBalance) {
    await home.checkExpectedTokenBalanceIsDisplayed(
      expectedTokenBalance,
      symbol,
    );
  }

  const sendPage = new SendPage(driver);
  const searchParams = new URLSearchParams({ chainId: TRON_CHAIN_ID });
  if (assetId) {
    searchParams.set('asset', assetId);
  }
  const sendUrl = `${driver.extensionUrl}/home.html#/send/amount-recipient?${searchParams.toString()}`;

  if ((await driver.getCurrentUrl()).includes('#/send')) {
    await new HomePage(driver).navigateToHome();
  }
  await driver.openNewURL(sendUrl);
  await sendPage.checkSendFormIsLoaded();
  return sendPage;
}
