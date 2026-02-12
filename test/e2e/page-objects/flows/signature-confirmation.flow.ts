import { Driver } from '../../webdriver/driver';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import TestDapp from '../pages/test-dapp';
import AccountDetailsModal from '../pages/confirmations/accountDetailsModal';
import { SignatureType } from '../../tests/confirmations/signatures/signature-helpers';
import { loginWithBalanceValidation } from './login.flow';

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
  await loginWithBalanceValidation(driver);
  const testDapp = new TestDapp(driver);
  await testDapp.openTestDappPage({ url: DAPP_URL });
  await testDapp.checkPageIsLoaded();
  await triggerSignatureInFlow(testDapp, type);
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
  await driver.delay(500); // Avoid "Element is not clickable" when closing modal
  await accountDetailsModal.clickAccountDetailsModalCloseButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.pasteIntoEip747ContractAddressInput();
}

/**
 * Asserts SIWE success message on test dapp.
 *
 * @param driver - The webdriver instance.
 * @param message - Expected signed message hex.
 */
export async function assertVerifiedSiweMessage(
  driver: Driver,
  message: string,
): Promise<void> {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  const testDapp = new TestDapp(driver);
  await testDapp.checkSuccessSiwe(message);
}

/**
 * Opens test dapp, clicks deploy NFTs, and switches to confirmation dialog.
 * Used only in NFT permit flow.
 *
 * @param driver - The webdriver instance.
 */
export async function openDappAndTriggerDeploy(driver: Driver): Promise<void> {
  await loginWithBalanceValidation(driver);
  const testDapp = new TestDapp(driver);
  await testDapp.openTestDappPage({ url: DAPP_URL });
  await testDapp.clickERC721DeployButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

/**
 * Triggers the given signature type on the test dapp (caller must have TestDapp in correct window).
 *
 * @param driver - The webdriver instance.
 * @param type - The signature type (SignatureType enum).
 */
export async function triggerSignature(
  driver: Driver,
  type: SignatureType,
): Promise<void> {
  const testDapp = new TestDapp(driver);
  await triggerSignatureInFlow(testDapp, type);
}

async function triggerSignatureInFlow(
  testDapp: TestDapp,
  type: SignatureType,
): Promise<void> {
  switch (type) {
    case SignatureType.PersonalSign:
      await testDapp.clickPersonalSign();
      break;
    case SignatureType.Permit:
      await testDapp.clickPermit();
      break;
    case SignatureType.SignTypedData:
      await testDapp.clickSignTypedData();
      break;
    case SignatureType.SignTypedDataV3:
      await testDapp.clickSignTypedDatav3();
      break;
    case SignatureType.SignTypedDataV4:
      await testDapp.clickSignTypedDatav4();
      break;
    case SignatureType.SIWE:
      await testDapp.clickSiwe();
      break;
    case SignatureType.SIWE_BadDomain:
      await testDapp.clickSwieBadDomain();
      break;
    case SignatureType.NFTPermit:
      await testDapp.clickERC721Permit();
      break;
    default:
      throw new Error('Invalid signature type');
  }
}
