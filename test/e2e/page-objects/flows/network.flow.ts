import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../pages/header-navbar';
import SelectNetwork from '../pages/dialog/select-network';
import NetworkSwitchModalConfirmation from '../pages/dialog/network-switch-modal-confirmation';
import SendTokenPage from '../pages/send/send-token-page';
import HomePage from '../pages/home/homepage';

/**
 * Search for a network in the select network dialog and switches to it.
 *
 * @param driver
 * @param networkName - The name of the network to search for and switch to.
 */
export const searchAndSwitchToNetworkFromGlobalMenuFlow = async (
  driver: Driver,
  networkName: string,
) => {
  console.log(
    `Search in select network dialog and switch to network ${networkName}`,
  );
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.check_pageIsLoaded();
  await headerNavbar.openGlobalNetworksMenu();

  const selectNetworkDialog = new SelectNetwork(driver);
  await selectNetworkDialog.check_pageIsLoaded();
  await selectNetworkDialog.fillNetworkSearchInput(networkName);
  await selectNetworkDialog.clickAddButton();

  const networkSwitchModalConfirmation = new NetworkSwitchModalConfirmation(
    driver,
  );
  await networkSwitchModalConfirmation.check_pageIsLoaded();
  await networkSwitchModalConfirmation.clickApproveButton();

  await headerNavbar.check_pageIsLoaded();
  await driver.delay(1000);
};

export const switchToNetworkFromSendFlow = async (
  driver: Driver,
  networkName: string,
) => {
  console.log(`Switch to network ${networkName} in header bar`);
  const headerNavbar = new HeaderNavbar(driver);
  const homePage = new HomePage(driver);
  await headerNavbar.check_pageIsLoaded();

  const sendToPage = new SendTokenPage(driver);
  await homePage.startSendFlow();
  await sendToPage.check_pageIsLoaded();
  await sendToPage.fillRecipient('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

  await sendToPage.clickAssetPickerButton();
  await sendToPage.clickMultichainAssetPickerNetwork();

  const selectNetworkDialog = new SelectNetwork(driver);
  await selectNetworkDialog.check_yourNetworksDialogIsLoaded();

  await selectNetworkDialog.selectNetworkName(networkName);

  await sendToPage.clickFirstTokenListButton();
  await sendToPage.clickSendFlowBackButton();

  await headerNavbar.check_pageIsLoaded();
};

export const switchToEditRPCViaGlobalMenuNetworks = async (driver: Driver) => {
  await driver.waitForSelector('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="global-menu-networks"]');
};

export const searchAndSwitchToNetworkFromSendFlow = async (
  driver: Driver,
  networkName: string,
) => {
  console.log(
    `Search in select network dialog and switch to network ${networkName}`,
  );
  switchToEditRPCViaGlobalMenuNetworks(driver);
  const selectNetworkDialog = new SelectNetwork(driver);
  await selectNetworkDialog.check_pageIsLoaded();
  await selectNetworkDialog.fillNetworkSearchInput(networkName);
  await selectNetworkDialog.clickAddButton();

  const networkSwitchModalConfirmation = new NetworkSwitchModalConfirmation(
    driver,
  );
  await networkSwitchModalConfirmation.check_pageIsLoaded();
  await networkSwitchModalConfirmation.clickApproveButton();
  await switchToNetworkFromSendFlow(driver, networkName);
};
