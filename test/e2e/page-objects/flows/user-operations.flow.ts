import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';
import { Bundler } from '../../bundler';
import ERC4337SnapPage from '../pages/erc4337-snap-page';
import SnapInstall from '../pages/dialog/snap-install';
import TestDapp from '../pages/test-dapp';
import UserOperationTransactionDetails from '../pages/user-operation-transaction-details';

/**
 * Flow for installing the ERC-4337 Account Abstraction Snap.
 *
 * @param driver - The WebDriver instance
 * @param snapUrl - The URL of the ERC-4337 snap dapp
 */
export async function installERC4337Snap(
  driver: Driver,
  snapUrl: string,
): Promise<void> {
  console.log('Installing ERC-4337 Account Abstraction Snap');

  const erc4337SnapPage = new ERC4337SnapPage(driver);
  const snapInstall = new SnapInstall(driver);

  // Open snap page and connect
  await erc4337SnapPage.openSnapPage(snapUrl);
  await erc4337SnapPage.connectToSnap();

  // Handle snap installation dialog
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await snapInstall.clickConnectButton();
  await snapInstall.checkPageIsLoaded();
  await snapInstall.clickConfirmButton();
  await snapInstall.clickOkButton();
}

/**
 * Flow for setting up the ERC-4337 snap with configuration and creating an account.
 *
 * @param driver - The WebDriver instance
 * @param config - Configuration object for the snap
 * @param config.bundlerUrl - The bundler URL
 * @param config.entrypoint - The entry point address
 * @param config.simpleAccountFactory - The simple account factory address
 * @param config.paymaster - Optional paymaster address
 * @param config.paymasterSK - Optional paymaster secret key
 * @param accountConfig - Account creation configuration
 * @param accountConfig.privateKey - The private key for the account
 * @param accountConfig.salt - The salt for account creation
 */
export async function setupERC4337SnapAccount(
  driver: Driver,
  config: {
    bundlerUrl: string;
    entrypoint: string;
    simpleAccountFactory: string;
    paymaster?: string;
    paymasterSK?: string;
  },
  accountConfig: {
    privateKey: string;
    salt: string;
  },
): Promise<void> {
  console.log('Setting up ERC-4337 snap account');

  const erc4337SnapPage = new ERC4337SnapPage(driver);

  // Configure the snap
  await erc4337SnapPage.setSnapConfiguration(config);

  // Create the snap account
  await erc4337SnapPage.createSnapAccount(
    accountConfig.privateKey,
    accountConfig.salt,
  );
}

/**
 * Flow for connecting a test dapp to the ERC-4337 snap account.
 *
 * @param driver - The WebDriver instance
 * @param accountAddress - The public address of the ERC-4337 account
 */
export async function connectTestDappToSnapAccount(
  driver: Driver,
  accountAddress: string,
): Promise<void> {
  console.log('Connecting test dapp to snap account');

  const testDapp = new TestDapp(driver);
  await testDapp.openTestDappPage();
  await testDapp.connectAccount({ publicAddress: accountAddress });
}

/**
 * Flow for validating transaction details against the user operation receipt.
 *
 * @param driver - The WebDriver instance
 * @param bundlerServer - The bundler server instance
 */
export async function validateTransactionDetailsWithReceipt(
  driver: Driver,
  bundlerServer: Bundler,
): Promise<void> {
  console.log('Validating transaction details with user operation receipt');

  const transactionDetails = new UserOperationTransactionDetails(driver);
  await transactionDetails.expectTransactionDetailsMatchReceipt(bundlerServer);
}

/**
 * Complete flow for setting up ERC-4337 snap, creating account, and connecting test dapp.
 * This combines the common setup steps used across multiple tests.
 *
 * @param driver - The WebDriver instance
 * @param snapUrl - The URL of the ERC-4337 snap dapp
 * @param config - Configuration object for the snap
 * @param config.bundlerUrl - The bundler URL
 * @param config.entrypoint - The entry point address
 * @param config.simpleAccountFactory - The simple account factory address
 * @param config.paymaster - Optional paymaster address
 * @param config.paymasterSK - Optional paymaster secret key
 * @param accountConfig - Account creation configuration
 * @param accountConfig.privateKey - The private key for the account
 * @param accountConfig.salt - The salt for account creation
 * @param accountAddress - The public address of the ERC-4337 account
 */
export async function setupCompleteERC4337Environment(
  driver: Driver,
  snapUrl: string,
  config: {
    bundlerUrl: string;
    entrypoint: string;
    simpleAccountFactory: string;
    paymaster?: string;
    paymasterSK?: string;
  },
  accountConfig: {
    privateKey: string;
    salt: string;
  },
  accountAddress: string,
): Promise<void> {
  console.log('Setting up complete ERC-4337 environment');

  // Install the snap
  await installERC4337Snap(driver, snapUrl);

  // Configure snap and create account
  await setupERC4337SnapAccount(driver, config, accountConfig);

  // Connect test dapp
  await connectTestDappToSnapAccount(driver, accountAddress);

  // Switch to extension view for further interactions
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
}
