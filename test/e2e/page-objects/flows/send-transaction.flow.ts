import HomePage from '../pages/homepage';
import ConfirmTxPage from '../pages/send/confirm-tx-page';
import SendTokenPage from '../pages/send/send-token-page';
import { Driver } from '../../webdriver/driver';

/**
 * This function initiates the steps required to send a transaction from the homepage to final confirmation.
 *
 * @param driver - The webdriver instance.
 * @param recipientAddress - The recipient address.
 * @param amount - The amount of the asset to be sent in the transaction.
 * @param gasfee - The expected transaction gas fee.
 * @param totalfee - The expected total transaction fee.
 */
export const sendTransaction = async (
  driver: Driver,
  recipientAddress: string,
  amount: string,
  gasfee: string,
  totalfee: string,
): Promise<void> => {
  console.log(
    `Start flow to send amount ${amount} to recipient ${recipientAddress} on home screen`,
  );
  // click send button on homepage to start flow
  const homePage = new HomePage(driver);
  await homePage.startSendFlow();

  // user should land on send token screen to fill recipient and amount
  const sendToPage = new SendTokenPage(driver);
  await sendToPage.check_pageIsLoaded();
  await sendToPage.fillRecipient(recipientAddress);
  await sendToPage.fillAmount(amount);
  await sendToPage.goToNextScreen();

  // confirm transaction when user lands on confirm transaction screen
  const confirmTxPage = new ConfirmTxPage(driver);
  await confirmTxPage.check_pageIsLoaded(gasfee, totalfee);
  await confirmTxPage.confirmTx();

  // user should land on homepage after transaction is confirmed
  await homePage.check_pageIsLoaded();
};
