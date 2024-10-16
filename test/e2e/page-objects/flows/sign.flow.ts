import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';
import SnapSimpleKeyringPage from '../pages/snap-simple-keyring-page';
import TestDapp from '../pages/test-dapp';

/**
 * This function initiates the steps for a personal sign with snap account on test dapp.
 *
 * @param driver - The webdriver instance.
 * @param publicAddress - The public address of the snap account.
 * @param isSyncFlow - Indicates whether synchronous approval option is on for the snap. Defaults to true.
 * @param approveTransaction - Indicates whether the transaction should be approved. Defaults to true.
 */
export const personalSignWithSnapAccount = async (
  driver: Driver,
  publicAddress: string,
  isSyncFlow: boolean = true,
  approveTransaction: boolean = true,
): Promise<void> => {
  const testDapp = new TestDapp(driver);
  await testDapp.check_pageIsLoaded();
  await testDapp.personalSign();
  if (!isSyncFlow) {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
      true,
    );
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.check_successPersonalSign(publicAddress);
  } else {
    await testDapp.check_failedPersonalSign(
      'Error: Request rejected by user or snap.',
    );
  }
};

/**
 * This function initiates the steps for a signTypedData with snap account on test dapp.
 *
 * @param driver - The webdriver instance.
 * @param publicAddress - The public address of the snap account.
 * @param isSyncFlow - Indicates whether synchronous approval option is on for the snap. Defaults to true.
 * @param approveTransaction - Indicates whether the transaction should be approved. Defaults to true.
 */
export const signTypedDataWithSnapAccount = async (
  driver: Driver,
  publicAddress: string,
  isSyncFlow: boolean = true,
  approveTransaction: boolean = true,
): Promise<void> => {
  const testDapp = new TestDapp(driver);
  await testDapp.check_pageIsLoaded();
  await testDapp.signTypedData();
  if (!isSyncFlow) {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
      true,
    );
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.check_successSignTypedData(publicAddress);
  } else {
    await testDapp.check_failedSignTypedData(
      'Error: Request rejected by user or snap.',
    );
  }
};

/**
 * This function initiates the steps for a signTypedDataV3 with snap account on test dapp.
 *
 * @param driver - The webdriver instance.
 * @param publicAddress - The public address of the snap account.
 * @param isSyncFlow - Indicates whether synchronous approval option is on for the snap. Defaults to true.
 * @param approveTransaction - Indicates whether the transaction should be approved. Defaults to true.
 */
export const signTypedDataV3WithSnapAccount = async (
  driver: Driver,
  publicAddress: string,
  isSyncFlow: boolean = true,
  approveTransaction: boolean = true,
): Promise<void> => {
  const testDapp = new TestDapp(driver);
  await testDapp.check_pageIsLoaded();
  await testDapp.signTypedDataV3();
  if (!isSyncFlow) {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
      true,
    );
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.check_successSignTypedDataV3(publicAddress);
  } else {
    await testDapp.check_failedSignTypedDataV3(
      'Error: Request rejected by user or snap.',
    );
  }
};

/**
 * This function initiates the steps for a signTypedDataV4 with snap account on test dapp.
 *
 * @param driver - The webdriver instance.
 * @param publicAddress - The public address of the snap account.
 * @param isSyncFlow - Indicates whether synchronous approval option is on for the snap. Defaults to true.
 * @param approveTransaction - Indicates whether the transaction should be approved. Defaults to true.
 */
export const signTypedDataV4WithSnapAccount = async (
  driver: Driver,
  publicAddress: string,
  isSyncFlow: boolean = true,
  approveTransaction: boolean = true,
): Promise<void> => {
  const testDapp = new TestDapp(driver);
  await testDapp.check_pageIsLoaded();
  await testDapp.signTypedDataV4();
  if (!isSyncFlow) {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
      true,
    );
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.check_successSignTypedDataV4(publicAddress);
  } else {
    await testDapp.check_failedSignTypedDataV4(
      'Error: Request rejected by user or snap.',
    );
  }
};

/**
 * This function initiates the steps for a signPermit with snap account on test dapp.
 *
 * @param driver - The webdriver instance.
 * @param publicAddress - The public address of the snap account.
 * @param isSyncFlow - Indicates whether synchronous approval option is on for the snap. Defaults to true.
 * @param approveTransaction - Indicates whether the transaction should be approved. Defaults to true.
 */
export const signPermitWithSnapAccount = async (
  driver: Driver,
  publicAddress: string,
  isSyncFlow: boolean = true,
  approveTransaction: boolean = true,
): Promise<void> => {
  const testDapp = new TestDapp(driver);
  await testDapp.check_pageIsLoaded();
  await testDapp.signPermit();
  if (!isSyncFlow) {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
      true,
    );
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.check_successSignPermit(publicAddress);
  } else {
    await testDapp.check_failedSignPermit(
      'Error: Request rejected by user or snap.',
    );
  }
};
