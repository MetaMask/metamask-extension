import { DEFAULT_BTC_BALANCE } from '../../constants';
import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import TokensTab from '../pages/home/tokens-tab';
import BitcoinReviewTxPage from '../pages/send/bitcoin-review-tx-page';
import SendPage from '../pages/send/send-page';

const BITCOIN_CHAIN_ID = 'bip122:000000000019d6689c085ae165831e93';

/**
 * Broadcasts a Bitcoin send transaction from the homepage through confirmation.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.recipientAddress - The recipient Bitcoin address.
 * @param params.amount - The amount of BTC to send.
 * @param params.expectedBalance - The expected BTC balance shown before sending. Defaults to DEFAULT_BTC_BALANCE.
 */
export const broadcastBitcoinSend = async ({
  driver,
  recipientAddress,
  amount,
  expectedBalance = DEFAULT_BTC_BALANCE,
}: {
  driver: Driver;
  recipientAddress: string;
  amount: string;
  expectedBalance?: number;
}): Promise<void> => {
  const homePage = new HomePage(driver);
  const assetList = new TokensTab(driver);
  await assetList.checkTokenAmountIsDisplayed(`${expectedBalance} BTC`);

  const sendPage = new SendPage(driver);
  await homePage.startSendFlow();
  await sendPage.selectToken(BITCOIN_CHAIN_ID, 'BTC');
  await sendPage.fillRecipient({ recipientAddress });
  await sendPage.fillAmount(amount);
  await sendPage.checkContinueButton({ state: 'enabled' });
  await sendPage.pressContinueButton();

  const reviewPage = new BitcoinReviewTxPage(driver);
  await reviewPage.checkPageIsLoaded();
  await reviewPage.clickConfirmButton();
};
