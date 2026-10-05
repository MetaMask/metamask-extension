import { Driver } from '../../webdriver/driver';
import { MetaMaskPayAccountSelectModal } from '../pages/confirmations/metamask-pay-account-select-modal';
import { MetaMaskPayConfirmation } from '../pages/confirmations/metamask-pay-confirmation';
import { MetaMaskPaySourceModal } from '../pages/confirmations/metamask-pay-source-modal';

/**
 * Fund the Pay transaction from a different wallet account via the
 * from-account pill and the "Select an account" modal.
 *
 * @param driver - The WebDriver instance.
 * @param confirmation - The loaded Pay confirmation.
 * @param address - Address of the account to fund from.
 * @param accountName - Display name expected on the pill afterwards.
 */
export async function selectPayFundingAccount(
  driver: Driver,
  confirmation: MetaMaskPayConfirmation,
  address: string,
  accountName: string,
): Promise<void> {
  console.log(`Select Pay funding account ${accountName}`);
  await confirmation.clickFromAccountPill();

  const accountSelectModal = new MetaMaskPayAccountSelectModal(driver);
  await accountSelectModal.checkPageIsLoaded();
  await accountSelectModal.selectAccount(address);

  await confirmation.checkFromAccount(accountName);
}

/**
 * Pick the pay token from the wallet asset list via the pay-with pill and the
 * "Pay with" modal.
 *
 * @param driver - The WebDriver instance.
 * @param confirmation - The loaded Pay confirmation.
 * @param chainId - Hex chain id of the token, e.g. `0x1`.
 * @param symbol - Token symbol, e.g. `USDC`.
 */
export async function selectPayToken(
  driver: Driver,
  confirmation: MetaMaskPayConfirmation,
  chainId: string,
  symbol: string,
): Promise<void> {
  console.log(`Select Pay token ${symbol} on ${chainId}`);
  await confirmation.clickPayWithPill();

  const payWithModal = new MetaMaskPaySourceModal(driver);
  await payWithModal.checkPageIsLoaded();
  await payWithModal.openOtherAssets();
  await payWithModal.selectToken(chainId, symbol);

  await confirmation.checkPayWithToken(symbol);
}
