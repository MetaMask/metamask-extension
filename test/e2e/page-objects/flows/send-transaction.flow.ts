import HomePage from '../pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import SnapSimpleKeyringPage from '../pages/snap-simple-keyring-page';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';
import ActivityTab from '../pages/home/activity-tab';
import { createInternalTransaction } from './transaction.flow';

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
  const transactionConfirmation = new TransactionConfirmation(driver);
  await transactionConfirmation.clickFooterConfirmButton();
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
  const transactionConfirmation = new TransactionConfirmation(driver);
  await transactionConfirmation.clickFooterConfirmButton();
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

export const validateTransaction = async (
  driver: Driver,
  amount: string,
): Promise<void> => {
  const activityTab = new ActivityTab(driver);
  await activityTab.goToActivityList();
  await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
  await activityTab.checkTxAction({ action: 'Sent ETH' });
  await activityTab.checkTxAmountInActivity(`${amount} ETH`, 1);
};

export const validateBalanceAndActivity = async (
  driver: Driver,
  expectedBalance: string,
  expectedActivityEntries = 1,
): Promise<void> => {
  await new HomePage(driver).checkExpectedBalanceIsDisplayed(expectedBalance);

  const activityTab = new ActivityTab(driver);
  await activityTab.goToActivityList();
  await activityTab.checkConfirmedTxNumberDisplayedInActivity(
    expectedActivityEntries,
  );

  if (expectedActivityEntries) {
    await activityTab.checkTxAction({ action: 'Sent ETH' });
  }
};
