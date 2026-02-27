import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../constants';
import TestDapp from '../pages/test-dapp';
import AccountDetailsModal from '../pages/confirmations/accountDetailsModal';

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
  await accountDetailsModal.waitForAddressCopied();
  await accountDetailsModal.clickAccountDetailsModalCloseButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.pasteIntoEip747ContractAddressInput();
}
