import HomePage from '../pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import SnapSimpleKeyringPage from '../pages/snap-simple-keyring-page';
import SnapTransactionConfirmation from '../pages/confirmations/snap-transaction-confirmation';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';
import ActivityListPage from '../pages/home/activity-list';
import SendPage from '../pages/send/send-page';
import { createInternalTransaction } from './transaction';

/**
 * Fills the send form (recipient and amount) and presses Continue. Use when the token is already selected.
 *
 * @param sendPage - The send page instance.
 * @param recipientAddress - The recipient address.
 * @param amount - The amount to send.
 */
export const fillSendFormAndPressContinue = async (
  sendPage: SendPage,
  recipientAddress: string,
  amount: string,
): Promise<void> => {
  await sendPage.fillRecipient(recipientAddress);
  await sendPage.fillAmount(amount);
  await sendPage.pressContinueButton();
};

/**
 * Waits for the snap transaction confirmation page to load.
 *
 * @param driver - The webdriver instance.
 */
export const waitForSnapTransactionConfirmation = async (
  driver: Driver,
): Promise<void> => {
  const confirmation = new SnapTransactionConfirmation(driver);
  await confirmation.checkPageIsLoaded();
};

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

  await createInternalTransaction({
    driver,
    recipientAddress,
    amount,
  });

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
  await createInternalTransaction({
    driver,
    recipientName: recipientAccount,
    amount,
  });

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
  await activityList.checkConfirmedTxNumberDisplayedInActivity(1);

  await activityList.checkTxAction({ action: 'Sent' });
  await activityList.checkTxAmountInActivity(`${quantity} ETH`, 1);
};
