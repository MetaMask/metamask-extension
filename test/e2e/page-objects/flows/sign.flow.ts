import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../constants';
import TestDapp from '../pages/test-dapp';
import PersonalSignConfirmation from '../pages/confirmations/personal-sign-confirmation';
import SignTypedDataConfirmation from '../pages/confirmations/sign-typed-data-confirmation';
import PermitConfirmation from '../pages/confirmations/permit-confirmation';
import { approveOrRejectSnapAccountTransaction } from './snap-simple-keyring.flow';

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
    await approveOrRejectSnapAccountTransaction(driver, {
      approveTransaction,
      isSignatureRequest: true,
    });
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
    await approveOrRejectSnapAccountTransaction(driver, {
      approveTransaction,
      isSignatureRequest: true,
    });
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
  await confirmation.clickScrollToBottomButton();
  if (isSyncFlow) {
    await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  } else {
    // Cannot wait for window to close as new window is opened with Finish signing.
    // So we add a hardcoded delay to avoid race condition with the window dialog being closed and re-opened very fast (to fix with MMQA-1240)
    await confirmation.clickFooterConfirmButton();
    await driver.delay(2000);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await approveOrRejectSnapAccountTransaction(driver, {
      approveTransaction,
      isSignatureRequest: true,
    });
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
  await confirmation.clickScrollToBottomButton();
  if (isSyncFlow) {
    await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  } else {
    // Cannot wait for window to close as new window is opened with Finish signing.
    // So we add a hardcoded delay to avoid race condition with the window dialog being closed and re-opened very fast (to fix with MMQA-1240)
    await confirmation.clickFooterConfirmButton();
    await driver.delay(2000);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await approveOrRejectSnapAccountTransaction(driver, {
      approveTransaction,
      isSignatureRequest: true,
    });
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
    await approveOrRejectSnapAccountTransaction(driver, {
      approveTransaction,
      isSignatureRequest: true,
    });
  }
  if ((!isSyncFlow && approveTransaction) || isSyncFlow) {
    await testDapp.checkSuccessSignPermit(publicAddress);
  } else {
    await testDapp.checkFailedSignPermit(
      'Error: Request rejected by user or snap.',
    );
  }
};

/**
 * Sign typed data (eth_signTypedData) flow (non-snap).
 *
 * @param driver - The webdriver instance.
 * @param publicAddress - Address expected to appear in the dapp verification.
 */
export const signTypedData = async (
  driver: Driver,
  publicAddress: string,
): Promise<void> => {
  const testDapp = new TestDapp(driver);
  await testDapp.checkPageIsLoaded();
  await testDapp.clickSignTypedData();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const confirmation = new SignTypedDataConfirmation(driver);
  await confirmation.verifyConfirmationHeadingTitle();
  await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  await testDapp.checkSuccessSignTypedData(publicAddress);
};

/**
 * Sign typed data V3 flow (non-snap).
 *
 * @param driver - The webdriver instance.
 * @param publicAddress - Address expected to appear in the dapp verification.
 */
export const signTypedDataV3 = async (
  driver: Driver,
  publicAddress: string,
): Promise<void> => {
  const testDapp = new TestDapp(driver);
  await testDapp.checkPageIsLoaded();
  await testDapp.clickSignTypedDatav3();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const confirmation = new SignTypedDataConfirmation(driver);
  await confirmation.verifyConfirmationHeadingTitle();
  await confirmation.clickScrollToBottomButton();
  await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  await testDapp.checkSuccessSignTypedDataV3(publicAddress);
};

/**
 * Sign typed data V4 flow (non-snap).
 *
 * @param driver - The webdriver instance.
 * @param publicAddress - Address expected to appear in the dapp verification.
 */
export const signTypedDataV4 = async (
  driver: Driver,
  publicAddress: string,
): Promise<void> => {
  const testDapp = new TestDapp(driver);
  await testDapp.checkPageIsLoaded();
  await testDapp.clickSignTypedDatav4();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const confirmation = new SignTypedDataConfirmation(driver);
  await confirmation.verifyConfirmationHeadingTitle();
  await confirmation.clickScrollToBottomButton();
  await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  await testDapp.checkSuccessSignTypedDataV4(publicAddress);
};
