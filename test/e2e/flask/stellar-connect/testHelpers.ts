import { DAPP_PATH } from '../../constants';
import { Driver } from '../../webdriver/driver';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import NetworkPermissionSelectModal from '../../page-objects/pages/dialog/network-permission-select-modal';

export const DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS = {
  dappOptions: {
    customDappPaths: [DAPP_PATH.TEST_DAPP_STELLAR],
  },
};

/**
 * Enables Stellar Testnet on the connect confirmation permissions tab.
 * @param driver
 */
export const enableStellarTestnetOnConnect = async (
  driver: Driver,
): Promise<void> => {
  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.goToPermissionsTab();
  await connectAccountConfirmation.openEditNetworksModal();

  const networkPermissionSelectModal = new NetworkPermissionSelectModal(driver);
  await networkPermissionSelectModal.checkPageIsLoaded();
  await networkPermissionSelectModal.selectNetwork({
    networkName: 'Stellar Testnet',
    shouldBeSelected: true,
  });
  await networkPermissionSelectModal.clickConfirmEditButton();
  await connectAccountConfirmation.checkPageIsLoaded();
};
