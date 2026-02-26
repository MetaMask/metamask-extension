import { Driver } from '../../webdriver/driver';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import TestDapp from '../pages/test-dapp';
import AccountDetailsModal from '../pages/confirmations/accountDetailsModal';
import { SignatureType } from '../../tests/confirmations/signatures/signature-helpers';

const MODAL_CLOSE_DELAY_MS = 500; // avoid "Element is not clickable" when closing account details modal

/**
 * Opens test dapp, triggers a signature by type, and switches to the confirmation dialog.
 *
 * @param driver - The webdriver instance.
 * @param type - The signature type (SignatureType enum).
 */
export async function openDappAndTriggerSignature(
  driver: Driver,
  type: SignatureType,
): Promise<void> {
  const testDapp = new TestDapp(driver);
  await testDapp.openTestDappPage({ url: DAPP_URL });
  await testDapp.checkPageIsLoaded();
  await testDapp.triggerSignature(type);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

/**
 * Copies address from account details modal and pastes into test dapp EIP-747 input.
 *
 * @param driver - The webdriver instance.
 */
export async function copyAddressAndPasteWalletAddress(
  driver: Driver,
): Promise<void> {
  const accountDetailsModal = new AccountDetailsModal(driver);
  const testDapp = new TestDapp(driver);
  await accountDetailsModal.clickAddressCopyButton();
  await driver.delay(MODAL_CLOSE_DELAY_MS);
  await accountDetailsModal.clickAccountDetailsModalCloseButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.pasteIntoEip747ContractAddressInput();
}
