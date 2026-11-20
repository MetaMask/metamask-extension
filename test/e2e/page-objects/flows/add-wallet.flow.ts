import { Driver } from '../../webdriver/driver';
import { largeDelayMs } from '../../helpers';
import AccountListPage from '../pages/accounts/list-page';
import ChooseWalletTypePage from '../pages/accounts/add-wallet/choose-wallet-type-page';
import ImportAccountPage from '../pages/accounts/add-wallet/import-account-page';
import ImportSrpPage from '../pages/accounts/add-wallet/import-srp-page';
import WatchAccountPage from '../pages/accounts/add-wallet/watch-account-page';

/**
 * Open the add wallet menu from the account list.
 * Expects the account list to be open.
 *
 * @param driver - The WebDriver instance.
 */
export async function openAddWalletMenu(driver: Driver): Promise<void> {
  await new AccountListPage(driver).clickAddWalletButton();
  await new ChooseWalletTypePage(driver).checkPageIsLoaded();
}

/**
 * Import an account with a JSON file from the account list.
 * Expects the account list to be open. On success the wallet navigates home
 * with the imported account selected.
 *
 * @param driver - The WebDriver instance.
 * @param params - The parameters object.
 * @param params.jsonFilePath - Path to the JSON file to import.
 * @param params.password - Password for the imported account.
 */
export async function importAccountWithJsonFile(
  driver: Driver,
  { jsonFilePath, password }: { jsonFilePath: string; password: string },
): Promise<void> {
  await openAddWalletMenu(driver);
  await new ChooseWalletTypePage(driver).clickImportAccount();

  const importAccountPage = new ImportAccountPage(driver);
  await importAccountPage.checkPageIsLoaded();
  await importAccountPage.importJsonFile(jsonFilePath, password);
}

/**
 * Import an account with a private key from the account list.
 * Expects the account list to be open. On success the wallet navigates home
 * with the imported account selected.
 *
 * @param driver - The WebDriver instance.
 * @param privateKey - Private key of the account.
 * @param expectedErrorMessage - Expected error message if the import should
 * fail. The import page stays open when the import fails.
 */
export async function importAccountWithPrivateKey(
  driver: Driver,
  privateKey: string,
  expectedErrorMessage?: string,
): Promise<void> {
  await openAddWalletMenu(driver);
  await new ChooseWalletTypePage(driver).clickImportAccount();

  const importAccountPage = new ImportAccountPage(driver);
  await importAccountPage.checkPageIsLoaded();
  await importAccountPage.importPrivateKey(privateKey, expectedErrorMessage);
}

/**
 * Import a wallet with a Secret Recovery Phrase from the account list.
 * Expects the account list to be open. On success the wallet navigates home
 * and shows the "wallet imported" toast.
 *
 * @param driver - The WebDriver instance.
 * @param srp - Space-separated recovery phrase words.
 */
export async function importWalletWithSrp(
  driver: Driver,
  srp: string,
): Promise<void> {
  await openAddWalletMenu(driver);
  await new ChooseWalletTypePage(driver).clickImportWallet();

  const importSrpPage = new ImportSrpPage(driver);
  await importSrpPage.checkPageIsLoaded();
  await importSrpPage.importSrp(srp);
}

/**
 * Open the hardware wallet type picker from the account list.
 * Expects the account list to be open.
 *
 * @param driver - The WebDriver instance.
 */
export async function openConnectHardwareWallet(driver: Driver): Promise<void> {
  await openAddWalletMenu(driver);
  await new ChooseWalletTypePage(driver).clickConnectHardwareWallet();
  // This delay is needed to mitigate an existing bug
  // See https://github.com/metamask/metamask-extension/issues/25851
  await driver.delay(largeDelayMs);
}

/**
 * Watch an Ethereum address from the account list.
 * Expects the account list to be open. On success the wallet navigates home
 * with the watched account selected.
 *
 * @param driver - The WebDriver instance.
 * @param address - The address to watch.
 * @param expectedErrorMessage - Expected error message if the address is
 * invalid. The watch page stays open when watching fails.
 */
export async function watchEthereumAccount(
  driver: Driver,
  address: string,
  expectedErrorMessage?: string,
): Promise<void> {
  await openAddWalletMenu(driver);
  await new ChooseWalletTypePage(driver).clickWatchEthereumAccount();

  const watchAccountPage = new WatchAccountPage(driver);
  await watchAccountPage.checkPageIsLoaded();
  await watchAccountPage.watchAccount(address, expectedErrorMessage);
}
