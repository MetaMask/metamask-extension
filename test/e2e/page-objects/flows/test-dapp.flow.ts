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
import Confirmation from '../pages/confirmations/confirmation';
import HomePage from '../pages/home/homepage';
import ActivityTab from '../pages/home/activity-tab';
import TokenTransferTransactionConfirmation from '../pages/confirmations/token-transfer-confirmation';
import NetworkManager from '../pages/network-manager';
import { CaveatTypes } from '../../../../shared/constants/permissions';
import { PermissionNames } from '../../../../app/scripts/controllers/permissions';
import { veryLargeDelayMs } from '../../helpers';

type ExpectedDetails = {
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
    await driver.delay(veryLargeDelayMs);
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
      await driver.delay(veryLargeDelayMs);
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

export async function selectDappClickPersonalSign(
  driver: Driver,
  dappUrl: string,
): Promise<void> {
  await driver.switchToWindowWithUrl(dappUrl);

  const testDapp = new TestDapp(driver);
  await testDapp.clickPersonalSign();
  await driver.waitForWindowWithTitleToBePresent(WINDOW_TITLES.Dialog);
}

export async function switchToDialogPopoverValidateDetailsRedesign(
  driver: Driver,
  expectedDetails: ExpectedDetails,
): Promise<void> {
  // Switches to the MetaMask Dialog window for confirmation
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.checkNetwork(
    expectedDetails.networkText,
  );
}

export async function validateBalanceAndActivity(
  driver: Driver,
  expectedBalance: string,
  expectedActivityEntries: number = 1,
): Promise<void> {
  // Ensure the balance changed if the the transaction was confirmed
  const homePage = new HomePage(driver);
  await homePage.checkExpectedBalanceIsDisplayed(expectedBalance);

  // Ensure there's an activity entry of "Sent" and "Confirmed"
  if (expectedActivityEntries) {
    const activityTab = new ActivityTab(driver);
    await activityTab.goToActivityList();
    await activityTab.checkTxAction({ action: 'Sent ETH' });
    await activityTab.checkConfirmedTxNumberDisplayedInActivity(
      expectedActivityEntries,
    );
  }
}

export async function confirmTransaction(driver: Driver): Promise<void> {
  const confirmation = new Confirmation(driver);
  await confirmation.clickFooterConfirmButton();
}

export async function openPopupWithActiveTabOrigin(
  driver: Driver,
  origin: string,
): Promise<void> {
  await driver.openNewPage(
    `${driver.extensionUrl}/${PAGES.POPUP}.html?activeTabOrigin=${origin}`,
  );
}

export async function openNetworkAndSelectNetwork(
  driver: Driver,
  tabName: string,
  networkName: string,
): Promise<void> {
  const networkManager = new NetworkManager(driver);
  await networkManager.openNetworkManager();
  await networkManager.selectTab(tabName);
  if (networkName.startsWith('eip155:')) {
    await networkManager.selectNetworkByChainId(networkName);
  } else {
    await networkManager.selectNetworkByNameWithWait(networkName);
  }
}

export async function openNetworkAndDeleteNetwork(
  driver: Driver,
  tabName: string,
  networkName: string,
): Promise<void> {
  const networkManager = new NetworkManager(driver);
  await networkManager.openNetworkManager();
  await networkManager.selectTab(tabName);
  await networkManager.deleteNetworkByChainId(networkName as `0x${string}`);
}
