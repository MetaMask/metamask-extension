import HomePage from '../pages/home/homepage';
import SendTokenPage from '../pages/send/send-token-page';
import { Driver } from '../../webdriver/driver';
import SnapSimpleKeyringPage from '../pages/snap-simple-keyring-page';
import TransactionConfirmation from '../pages/confirmations/redesign/transaction-confirmation';
import ActivityListPage from '../pages/home/activity-list';

/**
 * This function initiates the steps required to send a transaction from the homepage to final confirmation.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.recipientAddress - The recipient address.
 * @param params.amount - The amount of the asset to be sent in the transaction.
 */
export const sendRedesignedTransactionToAddress = async ({
  driver,
  recipientAddress,
  amount,
}: {
  driver: Driver;
  recipientAddress: string;
  amount: string;
}): Promise<void> => {
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
  const transactionConfirmationPage = new TransactionConfirmation(driver);
  await transactionConfirmationPage.clickFooterConfirmButton();
};

/**
 * This function initiates the steps required to send a transaction from the homepage to final confirmation.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.recipientAccount - The recipient account.
 * @param params.amount - The amount of the asset to be sent in the transaction.
 */
export const sendRedesignedTransactionToAccount = async ({
  driver,
  recipientAccount,
  amount,
}: {
  driver: Driver;
  recipientAccount: string;
  amount: string;
}): Promise<void> => {
  console.log(
    `Start flow to send amount ${amount} to recipient account ${recipientAccount} on home screen`,
  );
  // click send button on homepage to start flow
  const homePage = new HomePage(driver);
  await homePage.startSendFlow();

  // user should land on send token screen to fill recipient and amount
  const sendToPage = new SendTokenPage(driver);
  await sendToPage.check_pageIsLoaded();
  await sendToPage.selectRecipientAccount(recipientAccount);
  await sendToPage.fillAmount(amount);
  await sendToPage.goToNextScreen();

  // confirm transaction when user lands on confirm transaction screen
  const transactionConfirmationPage = new TransactionConfirmation(driver);
  await transactionConfirmationPage.clickFooterConfirmButton();
};

/**
 * This function initiates the steps required to send a transaction from snap account on homepage to final confirmation.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.recipientAddress - The recipient address.
 * @param params.amount - The amount of the asset to be sent in the transaction.
 * @param params.isSyncFlow - Indicates whether synchronous approval option is on for the snap. Defaults to true.
 * @param params.approveTransaction - Indicates whether the transaction should be approved. Defaults to true.
 */
export const sendRedesignedTransactionWithSnapAccount = async ({
  driver,
  recipientAddress,
  amount,
  isSyncFlow = true,
  approveTransaction = true,
}: {
  driver: Driver;
  recipientAddress: string;
  amount: string;
  isSyncFlow?: boolean;
  approveTransaction?: boolean;
}): Promise<void> => {
  await sendRedesignedTransactionToAddress({
    driver,
    recipientAddress,
    amount,
  });
  if (!isSyncFlow) {
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
    );
  }
};

export const validateTransaction = async (driver: Driver, quantity: string) => {
  const homePage = new HomePage(driver);
  await homePage.goToActivityList();
  const activityList = new ActivityListPage(driver);
  await activityList.check_confirmedTxNumberDisplayedInActivity(1);

  await activityList.check_txAction('Sent', 1);
  await activityList.check_txAmountInActivity(`${quantity} ETH`, 1);
};
