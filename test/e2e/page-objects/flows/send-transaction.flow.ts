import HomePage from '../pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import SnapSimpleKeyringPage from '../pages/snaps/simple-keyring-page';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';
import ActivityTab from '../pages/home/activity-tab';
import SendPage from '../pages/send/send-page';
import { createInternalTransaction } from './transaction.flow';
import { login } from './login.flow';

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
  await transactionConfirmation.clickFooterButton({ button: 'confirm' });
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
  await transactionConfirmation.clickFooterButton({ button: 'confirm' });
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

/**
 * Max-sends a native asset and checks that confirmation reserved gas and
 * Activity shows one confirmed Sent row with nothing failed or pending.
 *
 * @param params - Flow parameters.
 * @param params.driver - WebDriver for the extension.
 * @param params.chainId - Chain id of the send-list row to select.
 * @param params.recipientAddress - Address that receives the max send.
 * @param params.availableBalance - Available native balance shown before gas is reserved.
 * @param params.symbol - Native asset symbol. Defaults to ETH.
 */
export const sendNativeMaxAndCheckConfirmedActivity = async ({
  driver,
  chainId,
  recipientAddress,
  availableBalance,
  symbol = 'ETH',
}: {
  driver: Driver;
  chainId: string;
  recipientAddress: string;
  availableBalance: string;
  symbol?: string;
}): Promise<void> => {
  await login(driver, { validateBalance: false });

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.checkSendButtonIsClickable();
  await homePage.startSendFlow();

  const sendPage = new SendPage(driver);
  await sendPage.checkPageIsLoaded();
  await sendPage.createMaxSendRequest({
    chainId,
    symbol,
    recipientAddress,
  });

  const transactionConfirmation = new TransactionConfirmation(driver);
  await transactionConfirmation.checkPageIsLoaded();
  await transactionConfirmation.checkNativeMaxAmountBelowBalance(
    availableBalance,
  );
  await transactionConfirmation.clickScrollToBottomButton();
  await transactionConfirmation.clickFooterButton({
    button: 'confirm',
    waitUntil: 'disappear',
  });

  await homePage.checkPageIsLoaded();
  await homePage.goToActivityList();

  const activityTab = new ActivityTab(driver);
  await activityTab.checkTransactionActivityByText('Sent');
  await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
  await activityTab.checkNoFailedTransactions();
  await activityTab.checkNoPendingTransactions();
};

export const validateBalanceAndActivity = async (
  driver: Driver,
  expectedBalance: string,
  expectedActivityEntries = 1,
): Promise<void> => {
  const homePage = new HomePage(driver);
  await homePage.goToHomePage();
  await homePage.checkExpectedBalanceIsDisplayed(expectedBalance);

  const activityTab = new ActivityTab(driver);
  await activityTab.goToActivityList();
  await activityTab.checkConfirmedTxNumberDisplayedInActivity(
    expectedActivityEntries,
  );

  if (expectedActivityEntries) {
    await activityTab.checkTxAction({ action: 'Sent ETH' });
  }
};
