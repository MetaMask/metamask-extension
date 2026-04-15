import { TransactionParams } from '@metamask/transaction-controller';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import ActivityListPage from '../pages/home/activity-list';
import HomePage from '../pages/home/homepage';
import SendPage from '../pages/send/send-page';
import SnapSimpleKeyringPage from '../pages/snap-simple-keyring-page';
import TestDappIndividualRequest from '../pages/test-dapp-individual-request';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';

export const createInternalTransaction = async ({
  driver,
  chainId = '0x539',
  symbol = 'ETH',
  recipientAddress,
  recipientName,
  amount = '1',
  confirm = false,
}: {
  driver: Driver;
  chainId?: string;
  symbol?: string;
  recipientAddress?: string;
  recipientName?: string;
  amount?: string;
  confirm?: boolean;
}) => {
  const homePage = new HomePage(driver);
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

  if (confirm) {
    const transactionConfirmationPage = new TransactionConfirmation(driver);
    await transactionConfirmationPage.clickFooterConfirmButtonAndWaitToDisappear();
  }
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
 * {@link createInternalTransaction} with confirmation, then optionally approves via the snap keyring when not using sync flow.
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
  await createInternalTransaction({
    driver,
    recipientAddress,
    amount,
    confirm: true,
  });

  if (!isSyncFlow) {
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
    );
  }
};

/**
 * After a send completes, asserts activity list shows one confirmed send with the expected ETH amount label.
 */
export const validateTransaction = async (driver: Driver, quantity: string) => {
  const homePage = new HomePage(driver);
  await homePage.goToActivityList();
  const activityList = new ActivityListPage(driver);
  await activityList.checkConfirmedTxNumberDisplayedInActivity(1);

  await activityList.checkTxAction({ action: 'Sent' });
  await activityList.checkTxAmountInActivity(`${quantity} ETH`, 1);
};
