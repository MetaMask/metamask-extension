import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../pages/header-navbar';
import SelectNetwork from '../pages/dialog/select-network';
import NetworkSwitchModalConfirmation from '../pages/dialog/network-switch-modal-confirmation';

/**
 * Switches to a specified network in the header bar.
 *
 * @param driver
 * @param networkName - The name of the network to switch to.
 * @param toggleShowTestNetwork - A boolean indicating whether to toggle the display of test networks. Defaults to false.
 */
export const switchToNetworkFlow = async (
  driver: Driver,
  networkName: string,
  toggleShowTestNetwork: boolean = false,
) => {
  console.log(`Switch to network ${networkName} in header bar`);
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.check_pageIsLoaded();
  await headerNavbar.clickSwitchNetworkDropDown();

  const selectNetworkDialog = new SelectNetwork(driver);
  await selectNetworkDialog.check_pageIsLoaded();
  if (toggleShowTestNetwork) {
    await selectNetworkDialog.toggleShowTestNetwork();
  }
  await selectNetworkDialog.selectNetworkName(networkName);
  if (!networkName.includes('Bitcoin')) {
    await headerNavbar.check_currentSelectedNetwork(networkName);
  }
};

/**
 * Search for a network in the select network dialog and switches to it.
 *
 * @param driver
 * @param networkName - The name of the network to search for and switch to.
 */
export const searchAndSwitchToNetworkFlow = async (
  driver: Driver,
  networkName: string,
) => {
  console.log(
    `Search in select network dialog and switch to network ${networkName}`,
  );
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.check_pageIsLoaded();
  await headerNavbar.clickSwitchNetworkDropDown();

  const selectNetworkDialog = new SelectNetwork(driver);
  await selectNetworkDialog.check_pageIsLoaded();
  await selectNetworkDialog.fillNetworkSearchInput(networkName);
  await selectNetworkDialog.clickAddButton();

  const networkSwitchModalConfirmation = new NetworkSwitchModalConfirmation(
    driver,
  );
  await networkSwitchModalConfirmation.check_pageIsLoaded();
  await networkSwitchModalConfirmation.clickApproveButton();
  await headerNavbar.check_currentSelectedNetwork(networkName);
};
