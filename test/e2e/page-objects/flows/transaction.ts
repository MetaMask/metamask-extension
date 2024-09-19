import { TransactionParams } from '@metamask/transaction-controller';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/homepage';
import SendTokenPage from '../pages/send/send-token-page';
import TestDapp from '../pages/test-dapp';

export const createInternalTransaction = async (driver: Driver) => {
  // Firefox has incorrect balance if send flow started too quickly.
  await driver.delay(1000);

  const homePage = new HomePage(driver);
  await homePage.startSendFlow();

  const sendToPage = new SendTokenPage(driver);
  await sendToPage.check_pageIsLoaded();
  await sendToPage.fillRecipient('0x2f318C334780961FB129D2a6c30D0763d9a5C970');
  await sendToPage.fillAmount('1');
  await sendToPage.goToNextScreen();
};

export const createDappTransaction = async (
  driver: Driver,
  override?: Partial<TransactionParams>,
) => {
  const testDapp = new TestDapp(driver);

  await testDapp.request('eth_sendTransaction', [
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
