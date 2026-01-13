import { TransactionParams } from '@metamask/transaction-controller';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import TestDappIndividualRequest from '../pages/test-dapp-individual-request';
import SendPage from '../pages/send/send-page';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';

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
  // Firefox has incorrect balance if send flow started too quickly.
  await driver.delay(1000);

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
  // Firefox has incorrect balance if send flow started too quickly.
  await driver.delay(1000);

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

export const reviewTransaction = async (driver: Driver) => {
  const transactionConfirmation = new TransactionConfirmation(driver);
  await transactionConfirmation.validateSendFees();
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
