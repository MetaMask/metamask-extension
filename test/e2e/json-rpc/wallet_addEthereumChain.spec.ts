import { strict as assert } from 'assert';
import {
  CaveatConstraint,
  PermissionConstraint,
} from '@metamask/permission-controller';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import { PermissionNames } from '../../../app/scripts/controllers/permissions';
import { CaveatTypes } from '../../../shared/constants/permissions';
import AddNetworkConfirmation from '../page-objects/pages/confirmations/redesign/add-network-confirmations';
import Confirmation from '../page-objects/pages/confirmations/redesign/confirmation';
import Homepage from '../page-objects/pages/home/homepage';
import NetworkSwitchAlertModal from '../page-objects/pages/dialog/network-switch-alert-modal';
import ReviewPermissionsConfirmation from '../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import SelectNetwork from '../page-objects/pages/dialog/select-network';
import TestDapp from '../page-objects/pages/test-dapp';
import UpdateNetworkConfirmation from '../page-objects/pages/confirmations/redesign/update-network-confirmation';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';

const getPermittedChains = async (driver: Driver) => {
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

  return permittedChains;
};

describe('Add Ethereum Chain', function () {
  describe('the dapp is not already permitted to use the chain being added and the dapp is on a different chain from the chain being added', function () {
    it('automatically permits and switches to the chain when the rpc endpoint is added and no rpc endpoint previously existed for the chain', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder().build(),
          localNodeOptions: [
            {
              type: 'anvil',
            },
            {
              type: 'anvil',
              options: {
                port: 8546,
                chainId: 1338,
              },
            },
          ],
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();

          const beforePermittedChains = await getPermittedChains(driver);

          assert.deepEqual(beforePermittedChains, []);

          const switchEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x53a',
                chainName: 'Localhost 1338',
                nativeCurrency: {
                  name: '',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['http://localhost:8546'],
                blockExplorerUrls: [],
              },
            ],
          });

          await driver.executeScript(
            `window.ethereum.request(${switchEthereumChainRequest})`,
          );

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const addNetworkConfirmation = new AddNetworkConfirmation(driver);
          await addNetworkConfirmation.check_pageIsLoaded('Localhost 1338');
          await addNetworkConfirmation.approveAddNetwork();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.check_pageIsLoaded();

          const afterPermittedChains = await getPermittedChains(driver);
          assert.deepEqual(afterPermittedChains, ['0x53a']);
        },
      );
    });

    it('automatically permits and switches to the chain when the rpc endpoint is added but a different rpc endpoint already existed for the chain', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerDoubleNode()
            .build(),
          localNodeOptions: [
            {
              type: 'anvil',
            },
            {
              type: 'anvil',
              options: {
                port: 8546,
                chainId: 1338,
              },
            },
          ],
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();

          const beforePermittedChains = await getPermittedChains(driver);

          assert.deepEqual(beforePermittedChains, []);

          const switchEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x53a',
                chainName: 'Localhost 8546 alternative',
                nativeCurrency: {
                  name: '',
                  symbol: 'ETH',
                  decimals: 18,
                },
                // this does not match what already exists in the NetworkController
                rpcUrls: ['http://127.0.0.1:8546'],
                blockExplorerUrls: [],
              },
            ],
          });

          await driver.executeScript(
            `window.ethereum.request(${switchEthereumChainRequest})`,
          );

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const updateNetworkConfirmation = new UpdateNetworkConfirmation(
            driver,
          );
          await updateNetworkConfirmation.check_pageIsLoaded('Localhost 8546');
          await updateNetworkConfirmation.approveUpdateNetworkAndWaitToClose();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.check_pageIsLoaded();

          const afterPermittedChains = await getPermittedChains(driver);
          assert.deepEqual(afterPermittedChains, ['0x53a']);
        },
      );
    });

    it('prompts to switch to the chain when the rpc endpoint being added already exists', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerDoubleNode()
            .build(),
          localNodeOptions: [
            {
              type: 'anvil',
            },
            {
              type: 'anvil',
              options: {
                port: 8546,
                chainId: 1338,
              },
            },
          ],
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();

          const beforePermittedChains = await getPermittedChains(driver);

          assert.deepEqual(beforePermittedChains, []);

          const addEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x53a',
                chainName: 'Localhost 8546',
                nativeCurrency: {
                  name: '',
                  symbol: 'ETH',
                  decimals: 18,
                },
                // this matches what already exists in the NetworkController
                rpcUrls: ['http://localhost:8546'],
                blockExplorerUrls: [],
              },
            ],
          });

          await driver.executeScript(
            `window.ethereum.request(${addEthereumChainRequest})`,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const reviewPermissionsConfirmation =
            new ReviewPermissionsConfirmation(driver);
          await reviewPermissionsConfirmation.check_pageIsLoaded();
          await reviewPermissionsConfirmation.check_useEnabledNetworksMessageIsDisplayed();
          await reviewPermissionsConfirmation.check_networkIsDisplayed(
            'Localhost 8546',
          );
          await reviewPermissionsConfirmation.confirmReviewPermissions();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.check_pageIsLoaded();

          const afterPermittedChains = await getPermittedChains(driver);
          assert.deepEqual(afterPermittedChains, ['0x53a']);
        },
      );
    });
  });

  describe('the dapp is not already permitted to use the chain being added and the dapp is on the same chain as the chain being added', function () {
    it('automatically permits and switches to the chain when the rpc endpoint is added but a different rpc endpoint already existed for the chain', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();

          const beforePermittedChains = await getPermittedChains(driver);

          assert.deepEqual(beforePermittedChains, []);

          const switchEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x539',
                chainName: 'Localhost 8545 alternative',
                nativeCurrency: {
                  name: '',
                  symbol: 'ETH',
                  decimals: 18,
                },
                // this does not match what already exists in the NetworkController
                rpcUrls: ['http://127.0.0.1:8545'],
                blockExplorerUrls: [],
              },
            ],
          });

          await driver.executeScript(
            `window.ethereum.request(${switchEthereumChainRequest})`,
          );

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const updateNetworkConfirmation = new UpdateNetworkConfirmation(
            driver,
          );
          await updateNetworkConfirmation.check_pageIsLoaded('Localhost 8545');
          await updateNetworkConfirmation.approveUpdateNetworkAndWaitToClose();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.check_pageIsLoaded();

          const afterPermittedChains = await getPermittedChains(driver);
          assert.deepEqual(afterPermittedChains, ['0x539']);
        },
      );
    });

    it('prompts to switch to the chain when the rpc endpoint being added already exists', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerDoubleNode()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();

          const beforePermittedChains = await getPermittedChains(driver);

          assert.deepEqual(beforePermittedChains, []);

          const addEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x539',
                chainName: 'Localhost 8545',
                nativeCurrency: {
                  name: '',
                  symbol: 'ETH',
                  decimals: 18,
                },
                // this matches what already exists in the NetworkController
                rpcUrls: ['http://localhost:8545'],
                blockExplorerUrls: [],
              },
            ],
          });

          await driver.executeScript(
            `window.ethereum.request(${addEthereumChainRequest})`,
          );

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const reviewPermissionsConfirmation =
            new ReviewPermissionsConfirmation(driver);
          await reviewPermissionsConfirmation.check_pageIsLoaded();
          await reviewPermissionsConfirmation.check_useEnabledNetworksMessageIsDisplayed();
          await reviewPermissionsConfirmation.check_networkIsDisplayed(
            'Localhost 8545',
          );
          await reviewPermissionsConfirmation.confirmReviewPermissions();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.check_pageIsLoaded();

          const afterPermittedChains = await getPermittedChains(driver);
          assert.deepEqual(afterPermittedChains, ['0x539']);
        },
      );
    });
  });

  describe('the dapp is already permitted to use the chain being added, and the dapp is on a different chain from the chain being added', function () {
    it('automatically switches to the chain when the rpc endpoint is added but a different rpc endpoint already existed for the chain', async function () {
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
          localNodeOptions: [
            {
              type: 'anvil',
            },
            {
              type: 'anvil',
              options: {
                port: 8546,
                chainId: 1338,
              },
            },
          ],
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();

          const beforePermittedChains = await getPermittedChains(driver);
          assert.deepEqual(beforePermittedChains, ['0x539', '0x53a']);

          // should start on 1337
          await testDapp.check_networkIsConnected('0x539');

          const switchEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x53a',
                chainName: 'Localhost 8546 alternative',
                nativeCurrency: {
                  name: '',
                  symbol: 'ETH',
                  decimals: 18,
                },
                // this does not match what already exists in the NetworkController
                rpcUrls: ['http://127.0.0.1:8546'],
                blockExplorerUrls: [],
              },
            ],
          });

          await driver.executeScript(
            `window.ethereum.request(${switchEthereumChainRequest})`,
          );

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const updateNetworkConfirmation = new UpdateNetworkConfirmation(
            driver,
          );
          await updateNetworkConfirmation.check_pageIsLoaded('Localhost 8546');
          await updateNetworkConfirmation.approveUpdateNetworkAndWaitToClose();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.check_pageIsLoaded();

          const afterPermittedChains = await getPermittedChains(driver);
          assert.deepEqual(afterPermittedChains, ['0x539', '0x53a']);

          // should end on 1338
          await testDapp.check_networkIsConnected('0x53a');
        },
      );
    });

    it('automatically switches to the chain when the rpc endpoint being added already exists for the chain', async function () {
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
          localNodeOptions: [
            {
              type: 'anvil',
            },
            {
              type: 'anvil',
              options: {
                port: 8546,
                chainId: 1338,
              },
            },
          ],
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();

          const beforePermittedChains = await getPermittedChains(driver);
          assert.deepEqual(beforePermittedChains, ['0x539', '0x53a']);

          // should start on 1337
          await testDapp.check_networkIsConnected('0x539');

          const switchEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x53a',
                chainName: 'Localhost 8546',
                nativeCurrency: {
                  name: '',
                  symbol: 'ETH',
                  decimals: 18,
                },
                // this matches what already exists in the NetworkController
                rpcUrls: ['http://localhost:8546'],
                blockExplorerUrls: [],
              },
            ],
          });

          await driver.executeScript(
            `window.ethereum.request(${switchEthereumChainRequest})`,
          );

          const afterPermittedChains = await getPermittedChains(driver);
          assert.deepEqual(afterPermittedChains, ['0x539', '0x53a']);

          // should end on 1338
          await testDapp.check_networkIsConnected('0x53a');
        },
      );
    });
  });

  describe('the dapp is already permitted to use the chain being added, and the dapp is on the same chain as the chain being added, but the rpcEndpoint being proposed does not match any existing rpcEndpoints for the chain', function () {
    it('prompts to add the rpc endpoint to the chain networkConfiguration and set it as the default', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDappWithChains(['0x539'])
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();

          const beforePermittedChains = await getPermittedChains(driver);
          assert.deepEqual(beforePermittedChains, ['0x539']);

          await testDapp.check_networkIsConnected('0x539');

          const addEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x539',
                chainName: 'Alternative localhost chain 0x539',
                nativeCurrency: {
                  name: '',
                  symbol: 'ETH',
                  decimals: 18,
                },
                // this does not match what already exists in the NetworkController as an endpoint for this chain
                rpcUrls: ['http://127.0.0.1:8545'],
                blockExplorerUrls: [],
              },
            ],
          });

          await driver.executeScript(
            `window.ethereum.request(${addEthereumChainRequest})`,
          );

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const updateNetworkConfirmation = new UpdateNetworkConfirmation(
            driver,
          );
          await updateNetworkConfirmation.check_pageIsLoaded('Localhost 8545');
          await updateNetworkConfirmation.approveUpdateNetworkAndWaitToClose();
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          const homepage = new Homepage(driver);
          await homepage.check_pageIsLoaded();
          await homepage.check_expectedBalanceIsDisplayed();

          // go to network selector
          await homepage.headerNavbar.check_currentSelectedNetwork(
            'Localhost 8545',
          );
          await homepage.headerNavbar.clickSwitchNetworkDropDown();

          const selectNetworkDialog = new SelectNetwork(driver);
          await selectNetworkDialog.check_pageIsLoaded();
          await selectNetworkDialog.check_chainInformationIsDisplayed(
            'Alternative localhost chain 0x539',
          );
        },
      );
    });
  });

  describe('There are pending confirmation in the old network', function () {
    it('alert user about pending confirmations', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerDoubleNode()
            .withPermissionControllerConnectedToTestDappWithChains(['0x539'])
            .build(),
          localNodeOptions: [
            {
              type: 'anvil',
            },
            {
              type: 'anvil',
              options: {
                port: 8546,
                chainId: 1338,
              },
            },
          ],
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();
          await testDapp.clickPersonalSign();

          const beforePermittedChains = await getPermittedChains(driver);
          assert.deepEqual(beforePermittedChains, ['0x539']);

          // should start on 1337
          await testDapp.check_networkIsConnected('0x539');

          const switchEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x53a',
                chainName: 'Localhost 8546 alternative',
                nativeCurrency: {
                  name: '',
                  symbol: 'ETH',
                  decimals: 18,
                },
                // this does not match what already exists in the NetworkController
                rpcUrls: ['http://127.0.0.1:8546'],
                blockExplorerUrls: [],
              },
            ],
          });

          await driver.executeScript(
            `window.ethereum.request(${switchEthereumChainRequest})`,
          );

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const confirmation = new Confirmation(driver);
          await confirmation.check_pageIsLoaded();
          await confirmation.clickNextPage();

          // User reviews pending alerts
          const updateNetworkConfirmation = new UpdateNetworkConfirmation(
            driver,
          );
          await updateNetworkConfirmation.check_pageIsLoaded('Localhost 8546');
          await updateNetworkConfirmation.approveUpdateNetwork();
          const networkSwitchAlertModal = new NetworkSwitchAlertModal(driver);
          await networkSwitchAlertModal.check_pageIsLoaded();
          await networkSwitchAlertModal.clickShowPendingConfirmationButton();

          // user confirms add network confirmation
          await confirmation.check_pageIsLoaded();
          await confirmation.clickNextPage();
          await updateNetworkConfirmation.check_pageIsLoaded('Localhost 8546');
          await updateNetworkConfirmation.approveUpdateNetwork();
          await networkSwitchAlertModal.check_pageIsLoaded();
          await networkSwitchAlertModal.clickGotItButton();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.check_pageIsLoaded();

          const afterPermittedChains = await getPermittedChains(driver);
          assert.deepEqual(afterPermittedChains, ['0x539', '0x53a']);

          // should end on 1338
          await testDapp.check_networkIsConnected('0x53a');
        },
      );
    });
  });
});
