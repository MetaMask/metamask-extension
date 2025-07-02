import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';
import { DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC } from '../../constants';
import DecryptMessageConfirmation from '../pages/confirmations/redesign/decrypt-message-confirmation';
import GetEncryptionKeyConfirmation from '../pages/confirmations/redesign/get-encryption-key-confirmation';
import TestDapp from '../pages/test-dapp';

/**
 * Get encryption key in test dapp and verify the result.
 *
 * @param driver - The driver instance.
 * @param encryptionKey - The expected encryption key to display.
 * @param balanceValue - The balance value to check, default is DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC.
 */
export async function getEncryptionKeyInDapp(
  driver: Driver,
  encryptionKey: string,
  balanceValue: string = `${DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC} ETH`,
) {
  const testDapp = new TestDapp(driver);
  await testDapp.clickGetEncryptionKeyButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const getEncryptionKeyConfirmation = new GetEncryptionKeyConfirmation(driver);
  await getEncryptionKeyConfirmation.check_pageIsLoaded();
  // Check account balance is converted properly
  await getEncryptionKeyConfirmation.check_accountBalance(balanceValue);

  await getEncryptionKeyConfirmation.clickToConfirmProvideEncryptionKey();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.check_getEncryptionKeyResult(encryptionKey);
}

/**
 * Decrypt message in test dapp and verify the result.
 *
 * @param driver - The driver instance.
 * @param message - The message to decrypt.
 * @param balanceValue - The balance value to check, default is DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC.
 */
export async function decryptMessageAndVerifyResult(
  driver: Driver,
  message: string,
  balanceValue: string = `${DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC} ETH`,
) {
  console.log('Decrypt message in test dapp and verify the result');
  const testDapp = new TestDapp(driver);
  await testDapp.clickDecryptButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const decryptMessageConfirmation = new DecryptMessageConfirmation(driver);
  await decryptMessageConfirmation.check_pageIsLoaded();

  // Check account balance is converted properly
  await decryptMessageConfirmation.check_accountBalance(balanceValue);

  // Click decrypt message button and verify the result
  await decryptMessageConfirmation.clickDecryptMessageButton();
  await decryptMessageConfirmation.check_decryptedMessage(message);
  await decryptMessageConfirmation.clickToConfirmDecryptMessage();
}
