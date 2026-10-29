import { TransactionParams } from '@metamask/transaction-controller';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import ActivityTab from '../pages/home/activity-tab';
import HomePage from '../pages/home/homepage';
import TestDappIndividualRequest from '../pages/test-dapp-individual-request';
import SendPage from '../pages/send/send-page';
import SnapSimpleKeyringPage from '../pages/snaps/simple-keyring-page';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';
import { login } from './login.flow';

export const createInternalTransaction = async ({
  driver,
  chainId = '0x539',
  symbol = 'ETH',
  recipientAddress,
  recipientName,
  amount = '1',
}: {
  driver: Driver;
  chainId?: string;
  symbol?: string;
  recipientAddress?: string;
  recipientName?: string;
  amount?: string;
}) => {
  const homePage = new HomePage(driver);
  await homePage.waitForNetworkStatusAvailable();
  await homePage.startSendFlow();

  let respAddress = recipientAddress;
  if (!recipientAddress && !recipientName) {
    respAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
  }

  const sendPage = new SendPage(driver);
  await sendPage.createSendRequest({
    chainId,
    symbol,
    recipientAddress: respAddress,
    recipientName,
    amount,
  });
};

export const createInternalTransactionWithMaxAmount = async ({
  driver,
  chainId = '0x539',
  symbol = 'ETH',
  recipientAddress,
  recipientName,
}: {
  driver: Driver;
  chainId?: string;
  symbol?: string;
  recipientAddress?: string;
  recipientName?: string;
}) => {
  const homePage = new HomePage(driver);
  await homePage.waitForNetworkStatusAvailable();
  await homePage.startSendFlow();

  let respAddress = recipientAddress;
  if (!recipientAddress && !recipientName) {
    respAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
  }

  const sendPage = new SendPage(driver);
  await sendPage.createMaxSendRequest({
    chainId,
    symbol,
    recipientAddress: respAddress,
    recipientName,
  });
};

export const createDappTransaction = async (
  driver: Driver,
  override?: Partial<TransactionParams>,
) => {
  const testDappIndividualRequest = new TestDappIndividualRequest(driver);

  await testDappIndividualRequest.request('eth_sendTransaction', [
    {
      data: '0x',
      from: DEFAULT_FIXTURE_ACCOUNT,
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
      to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
      value: '0x38d7ea4c68000',
      type: '0x2',
      ...override,
    },
  ]);
};

/**
 * This function initiates the steps required to send a transaction from the homepage to final confirmation.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.recipientAddress - The recipient address. Provide this or `recipientName`.
 * @param params.recipientName - The recipient account name. Provide this or `recipientAddress`.
 * @param params.amount - The amount of the asset to be sent in the transaction.
 */
export const sendTransaction = async ({
  driver,
  recipientAddress,
  recipientName,
  amount,
}: {
  driver: Driver;
  amount: string;
} & (
  | { recipientAddress: string; recipientName?: never }
  | { recipientName: string; recipientAddress?: never }
)): Promise<void> => {
  console.log(
    `Start flow to send amount ${amount} to recipient ${recipientAddress ?? recipientName} on home screen`,
  );

  await createInternalTransaction({
    driver,
    recipientAddress,
    recipientName,
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
export const sendTransactionWithSnapAccount = async ({
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
  await sendTransaction({
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
