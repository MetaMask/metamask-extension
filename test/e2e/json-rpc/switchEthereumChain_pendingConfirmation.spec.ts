import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import Confirmation from '../page-objects/pages/confirmations/redesign/confirmation';
import NetworkSwitchAlertModal from '../page-objects/pages/dialog/network-switch-alert-modal';
import ReviewPermissionsConfirmation from '../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import SwitchNetworkConfirmation from '../page-objects/pages/confirmations/redesign/switch-network-confirmation';
import TestDapp from '../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';

describe('Switch Ethereum Chain for two dapps with pending confirmation in the old network', function () {
  it('show alerts on permission network if user does not have permission on new network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withPermissionControllerConnectedToTestDappWithChains(['0x539'])
          .build(),
        dappOptions: { numberOfDapps: 2 },
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              blockTime: 2,
              vmErrorsOnRPCResponse: false,
              mnemonic:
                'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
              port: 8546,
              chainId: 1338,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.clickPersonalSign();

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Initiate switchEthereumChain on the Dapp
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.check_pageIsLoaded();
        await confirmation.clickNextPage();

        // User reviews pending alerts
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.check_pageIsLoaded();
        await reviewPermissionsConfirmation.clickConfirmReviewPermissionsButton();
        const networkSwitchAlertModal = new NetworkSwitchAlertModal(driver);
        await networkSwitchAlertModal.check_pageIsLoaded();
        await networkSwitchAlertModal.clickShowPendingConfirmationButton();

        // user confirms permissions
        await confirmation.check_pageIsLoaded();
        await confirmation.clickNextPage();
        await reviewPermissionsConfirmation.check_pageIsLoaded();
        await reviewPermissionsConfirmation.clickConfirmReviewPermissionsButton();
        await networkSwitchAlertModal.check_pageIsLoaded();
        await networkSwitchAlertModal.clickGotItButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();

        // Wait for chain id element to change, there's a page reload.
        await testDapp.check_networkIsConnected('0x53a');
      },
    );
  });

  it('show alerts on switch network page if user does has permission on new network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withPermissionControllerConnectedToTestDappWithChains([
            '0x539',
            '0x53a',
          ])
          .build(),
        dappOptions: { numberOfDapps: 2 },
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              blockTime: 2,
              vmErrorsOnRPCResponse: false,
              mnemonic:
                'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
              port: 8546,
              chainId: 1338,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.clickPersonalSign();

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Initiate switchEthereumChain on the Dapp
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.check_pageIsLoaded();
        await confirmation.clickNextPage();

        // User reviews pending alerts
        const switchNetworkConfirmation = new SwitchNetworkConfirmation(driver);
        await switchNetworkConfirmation.check_pageIsLoaded();
        await switchNetworkConfirmation.clickApproveSwitchNetwork();
        const networkSwitchAlertModal = new NetworkSwitchAlertModal(driver);
        await networkSwitchAlertModal.check_pageIsLoaded();
        await networkSwitchAlertModal.clickShowPendingConfirmationButton();

        // user confirms permissions
        await confirmation.check_pageIsLoaded();
        await confirmation.clickNextPage();
        await switchNetworkConfirmation.check_pageIsLoaded();
        await switchNetworkConfirmation.clickApproveSwitchNetwork();
        await networkSwitchAlertModal.check_pageIsLoaded();
        await networkSwitchAlertModal.clickGotItButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();

        // Wait for chain id element to change, there's a page reload.
        await testDapp.check_networkIsConnected('0x53a');
      },
    );
  });
});
