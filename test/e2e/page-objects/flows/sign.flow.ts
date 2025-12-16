import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';
import SnapSimpleKeyringPage from '../pages/snap-simple-keyring-page';
import TestDapp from '../pages/test-dapp';
import PersonalSignConfirmation from '../pages/confirmations/redesign/personal-sign-confirmation';
import SignTypedDataConfirmation from '../pages/confirmations/redesign/sign-typed-data-confirmation';
import PermitConfirmation from '../pages/confirmations/redesign/permit-confirmation';

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
  await testDapp.checkPageIsLoaded();
  await testDapp.clickPersonalSign();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const confirmation = new PersonalSignConfirmation(driver);
  await confirmation.verifyConfirmationHeadingTitle();
  if (isSyncFlow) {
    await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  } else {
    // Cannot wait for window to close as new window is opened with Finish signing.
    // So we add a hardcoded delay to avoid race condition with the window dialog being closed and re-opened very fast (to fix with MMQA-1240)
    await confirmation.clickFooterConfirmButton();
    await driver.delay(2000);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
      true,
    );
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.checkSuccessPersonalSign(publicAddress);
  } else {
    await testDapp.checkFailedPersonalSign(
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
  await testDapp.checkPageIsLoaded();
  await testDapp.clickSignTypedData();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const confirmation = new SignTypedDataConfirmation(driver);
  await confirmation.verifyConfirmationHeadingTitle();
  if (isSyncFlow) {
    await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  } else {
    // Cannot wait for window to close as new window is opened with Finish signing.
    // So we add a hardcoded delay to avoid race condition with the window dialog being closed and re-opened very fast (to fix with MMQA-1240)
    await confirmation.clickFooterConfirmButton();
    await driver.delay(2000);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
      true,
    );
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.checkSuccessSignTypedData(publicAddress);
  } else {
    await testDapp.checkFailedSignTypedData(
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
  await testDapp.checkPageIsLoaded();
  await testDapp.clickSignTypedDatav3();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const confirmation = new SignTypedDataConfirmation(driver);
  await confirmation.verifyConfirmationHeadingTitle();
  if (isSyncFlow) {
    await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  } else {
    // Cannot wait for window to close as new window is opened with Finish signing.
    // So we add a hardcoded delay to avoid race condition with the window dialog being closed and re-opened very fast (to fix with MMQA-1240)
    await confirmation.clickFooterConfirmButton();
    await driver.delay(2000);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
      true,
    );
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.checkSuccessSignTypedDataV3(publicAddress);
  } else {
    await testDapp.checkFailedSignTypedDataV3(
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
  await testDapp.checkPageIsLoaded();
  await testDapp.clickSignTypedDatav4();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const confirmation = new SignTypedDataConfirmation(driver);
  await confirmation.verifyConfirmationHeadingTitle();
  if (isSyncFlow) {
    await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  } else {
    // Cannot wait for window to close as new window is opened with Finish signing.
    // So we add a hardcoded delay to avoid race condition with the window dialog being closed and re-opened very fast (to fix with MMQA-1240)
    await confirmation.clickFooterConfirmButton();
    await driver.delay(2000);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
      true,
    );
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.checkSuccessSignTypedDataV4(publicAddress);
  } else {
    await testDapp.checkFailedSignTypedDataV4(
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
  await testDapp.checkPageIsLoaded();
  await testDapp.clickPermit();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const confirmation = new PermitConfirmation(driver);
  await confirmation.verifyOrigin();
  if (isSyncFlow) {
    await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  } else {
    // Cannot wait for window to close as new window is opened with Finish signing.
    // So we add a hardcoded delay to avoid race condition with the window dialog being closed and re-opened very fast (to fix with MMQA-1240)
    await confirmation.clickFooterConfirmButton();
    await driver.delay(2000);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
      true,
    );
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.checkSuccessSignPermit(publicAddress);
  } else {
    await testDapp.checkFailedSignPermit(
      'Error: Request rejected by user or snap.',
    );
  }
};
