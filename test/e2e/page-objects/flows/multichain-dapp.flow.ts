import { Json } from '@metamask/utils';
import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';
import TestDappMultichain from '../pages/test-dapp-multichain';

/**
 * Connects the multichain test dapp over `externally_connectable`, invokes a
 * method through the Multichain API (`wallet_invokeMethod`), and lands on the
 * resulting transaction confirmation.
 *
 * @param driver - The webdriver instance.
 * @param extensionId - The extension id the dapp connects to.
 * @param request - The request to invoke.
 * @param request.scope - The CAIP-2 scope to invoke the method on.
 * @param request.method - The JSON-RPC method to invoke.
 * @param request.params - The parameters for the JSON-RPC method.
 * @returns The loaded transaction confirmation.
 */
export const invokeCaipTransaction = async (
  driver: Driver,
  extensionId: string,
  { scope, method, params }: { scope: string; method: string; params?: Json },
): Promise<TransactionConfirmation> => {
  const testDapp = new TestDappMultichain(driver);
  await testDapp.openTestDappPage();
  await testDapp.checkPageIsLoaded();
  await testDapp.connectExternallyConnectable(extensionId);

  await testDapp.invokeMethod({ scope, method, params });

  // The dialog is opened by the background service worker, which can still
  // report the window as missing for a moment after the request is dispatched.
  await driver.waitForWindowWithTitleToBePresent(WINDOW_TITLES.Dialog);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const confirmation = new TransactionConfirmation(driver);
  await confirmation.checkPageIsLoaded();

  return confirmation;
};
