import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import PersonalSignConfirmation from '../pages/confirmations/personal-sign-confirmation';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';
import TestDapp from '../pages/test-dapp';

export type DappConfirmationType = 'signature' | 'transaction';

/**
 * Triggers a dapp request from the test dapp and switches to the notification
 * window it opens.
 *
 * @param driver - The webdriver instance.
 * @param type - Personal sign or a simple send transaction.
 */
export async function requestDappConfirmation(
  driver: Driver,
  type: DappConfirmationType,
): Promise<void> {
  const testDapp = new TestDapp(driver);
  await testDapp.openTestDappPage();
  await testDapp.checkPageIsLoaded();
  if (type === 'signature') {
    await testDapp.clickPersonalSign();
  } else {
    await testDapp.clickSimpleSendButton();
  }
  await driver.waitForWindowWithTitleToBePresent(WINDOW_TITLES.Dialog);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

/**
 * Checks the pending confirmation is rendered and still actionable by
 * rejecting it and verifying the test dapp receives the rejection.
 *
 * @param driver - The webdriver instance, focused on the notification window.
 * @param type - The confirmation type requested by `requestDappConfirmation`.
 */
export async function rejectDappConfirmation(
  driver: Driver,
  type: DappConfirmationType,
): Promise<void> {
  if (type === 'signature') {
    const confirmation = new PersonalSignConfirmation(driver);
    await confirmation.checkPageIsLoaded();
    await confirmation.verifyConfirmationHeadingTitle();
    await confirmation.clickFooterButton({
      button: 'cancel',
      waitUntil: 'windowClose',
    });
    await new TestDapp(driver).checkFailedPersonalSign(
      'Error: User rejected the request.',
    );
    return;
  }
  const confirmation = new TransactionConfirmation(driver);
  await confirmation.checkPageIsLoaded();
  await confirmation.clickFooterButton({
    button: 'cancel',
    waitUntil: 'windowClose',
  });
}
