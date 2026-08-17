import {
  CaveatConstraint,
  PermissionConstraint,
} from '@metamask/permission-controller';
import { Driver, PAGES } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../constants';
import TestDapp from '../pages/test-dapp';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import ReviewPermissionsConfirmation from '../pages/confirmations/review-permissions-confirmation';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';
import TokenTransferTransactionConfirmation from '../pages/confirmations/token-transfer-confirmation';
import { CaveatTypes } from '../../../../shared/constants/permissions';
import { PermissionNames } from '../../../../app/scripts/controllers/permissions';

export type ConfirmationExpectedDetails = {
  chainId: string;
  networkText: string;
  originText: string;
};

/**
 * Connects account to test dapp with Dialog handling and optional verification.
 * This flow handles the complete connection process: clicking connect button,
 * confirming in Dialog, and optionally verifying the connection.
 *
 * @param driver - The webdriver instance.
 * @param options - Optional parameters.
 * @param [options.publicAddress] - The public address to verify after connection.
 * @param [options.chainId] - The chain id to verify, defaults to 0x539.
 */
export const connectAccountToTestDapp = async (
  driver: Driver,
  options: {
    publicAddress?: string;
    chainId?: string;
  } = {},
): Promise<void> => {
  const { publicAddress, chainId = '0x539' } = options;
  const testDapp = new TestDapp(driver);

  // Step 1: Click connect account button in TestDApp
  await testDapp.connectAccount();

  // Step 2: Handle Dialog interaction
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  // Step 3: Switch back to TestDApp and verify if needed
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  if (publicAddress) {
    await testDapp.verifyAccountConnection(publicAddress, chainId);
  }
};

export async function openDappAndSwitchChain(
  driver: Driver,
  dappUrl: string,
  chainId?: string,
): Promise<void> {
  // Open the dapp
  const testDapp = new TestDapp(driver);
  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
    driver,
  );

  // Open the dapp
  await driver.openNewPage(dappUrl);

  // Connect to the dapp
  await testDapp.clickConnectAccountButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await connectAccountConfirmation.confirmConnect();

  // Switch back to the dapp
  await driver.switchToWindowWithUrl(dappUrl);

  // Switch chains if necessary
  if (chainId) {
    await driver.waitForWindowWithTitleToBePresent(WINDOW_TITLES.TestDApp);
    const getPermissionsRequest = JSON.stringify({
      method: 'wallet_getPermissions',
    });
    const getPermissionsResult = await driver.executeScript(
      `return window.ethereum.request(${getPermissionsRequest})`,
    );

    const permittedChains =
      getPermissionsResult
        ?.find(
          (permission: PermissionConstraint) =>
            permission.parentCapability === PermissionNames.permittedChains,
        )
        ?.caveats.find(
          (caveat: CaveatConstraint) =>
            caveat.type === CaveatTypes.restrictNetworkSwitching,
        )?.value || [];

    const isAlreadyPermitted = permittedChains.includes(chainId);

    const switchChainRequest = JSON.stringify({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });

    await driver.executeScript(
      `window.ethereum.request(${switchChainRequest})`,
    );

    if (!isAlreadyPermitted) {
      await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

      await reviewPermissionsConfirmation.clickConfirmReviewPermissionsButtonWithWaitForWindowToClose();

      // Switch back to the dapp
      await driver.switchToWindowWithUrl(dappUrl);
    }
  }
}

export async function selectDappClickSend(
  driver: Driver,
  dappUrl: string,
): Promise<void> {
  const testDapp = new TestDapp(driver);
  const transactionConfirmation = new TransactionConfirmation(driver);

  await driver.switchToWindowWithUrl(dappUrl);
  await testDapp.clickSimpleSendButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await transactionConfirmation.checkDappInitiatedHeadingTitle();
}

export async function switchToDialogPopoverValidateDetailsRedesign(
  driver: Driver,
  expectedDetails: ConfirmationExpectedDetails,
): Promise<void> {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.checkNetwork(
    expectedDetails.networkText,
  );
}

export async function openPopupWithActiveTabOrigin(
  driver: Driver,
  origin: string,
): Promise<void> {
  await driver.openNewPage(
    `${driver.extensionUrl}/${PAGES.POPUP}.html?activeTabOrigin=${origin}`,
  );
}
