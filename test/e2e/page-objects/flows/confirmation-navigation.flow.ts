import { WINDOW_TITLES } from '../../constants';
import { SIGN_TYPED_DATA_EXPECTED } from '../../tests/confirmations/signatures/sign-typed-data-expected';
import { Driver } from '../../webdriver/driver';
import SignTypedData from '../pages/confirmations/sign-typed-data-confirmation';
import TestDapp from '../pages/test-dapp';

/**
 * Queues sign typed data, sign typed data v3, and sign typed data v4 requests
 * without confirming them.
 *
 * @param driver - The webdriver instance.
 */
export const queueSignatures = async (driver: Driver): Promise<void> => {
  const testDapp = new TestDapp(driver);
  const confirmation = new SignTypedData(driver);

  // Sign Typed Data
  await testDapp.clickSignTypedData();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.verifySignTypedDataMessage(
    SIGN_TYPED_DATA_EXPECTED.v1Message,
  );

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  // Sign Typed Data V3
  await testDapp.clickSignTypedDatav3();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.checkPageNumbers(1, 2);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  // Sign Typed Data V4
  await testDapp.clickSignTypedDatav4();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.checkPageNumbers(1, 3);
};

/**
 * Queues sign typed data, a simple send transaction, and sign typed data v3
 * requests without confirming them.
 *
 * @param driver - The webdriver instance.
 */
export const queueSignaturesAndTransactions = async (
  driver: Driver,
): Promise<void> => {
  const testDapp = new TestDapp(driver);
  const confirmation = new SignTypedData(driver);

  // Sign Typed Data
  await testDapp.clickSignTypedData();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.verifySignTypedDataMessage(
    SIGN_TYPED_DATA_EXPECTED.v1Message,
  );

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  // Send Transaction
  await testDapp.clickSimpleSendButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.checkPageNumbers(1, 2);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  // Sign Typed Data V3
  await testDapp.clickSignTypedDatav3();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.checkPageNumbers(1, 3);
};
