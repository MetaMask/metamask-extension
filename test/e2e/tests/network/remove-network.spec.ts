import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { NetworkStatus, RpcEndpointType } from '@metamask/network-controller';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  SECOND_NODE_NETWORK_CLIENT_ID,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import AddEditNetworkModal from '../../page-objects/pages/dialog/add-edit-network';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { getPermittedChains } from './common';

describe('Remove Network:', function (this: Suite) {
  it('should remove the chainId from existing permissions when a network configuration is removed entirely', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withNetworkControllerDoubleNode()
          .withPermissionControllerConnectedToTestDapp({
            chainIds: [1337, 1338],
          })
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
        await testDapp.checkPageIsLoaded();

        const beforePermittedChains = await getPermittedChains(driver);
        assert.deepEqual(beforePermittedChains, ['0x539', '0x53a']);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homepage = new HomePage(driver);
        await homepage.checkPageIsLoaded();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.deleteNetwork('eip155:1338');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();

        const afterPermittedChains = await getPermittedChains(driver);
        assert.deepEqual(afterPermittedChains, ['0x539']);
      },
    );
  });

  it('should not remove the chainId from existing permissions when a network client is removed but other network clients still exist for the chainId', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withNetworkController({
            networkConfigurationsByChainId: {
              '0x53a': {
                blockExplorerUrls: [],
                chainId: '0x53a',
                defaultRpcEndpointIndex: 0,
                name: 'Localhost 8546',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    networkClientId: SECOND_NODE_NETWORK_CLIENT_ID,
                    type: RpcEndpointType.Custom,
                    url: 'http://localhost:8546',
                  },
                  {
                    networkClientId: '2ce66016-8aab-47df-b27f-318c80865eb1',
                    type: RpcEndpointType.Custom,
                    url: 'http://127.0.0.1:8546',
                  },
                ],
              },
            },
            networksMetadata: {
              [SECOND_NODE_NETWORK_CLIENT_ID]: {
                EIPS: {},
                status: NetworkStatus.Available,
              },
              '2ce66016-8aab-47df-b27f-318c80865eb1': {
                EIPS: {},
                status: NetworkStatus.Available,
              },
            },
          })
          .withPermissionControllerConnectedToTestDapp({
            chainIds: [1337, 1338],
          })
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
        await testDapp.checkPageIsLoaded();

        const beforePermittedChains = await getPermittedChains(driver);
        assert.deepEqual(beforePermittedChains, ['0x539', '0x53a']);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openNetworkListOptions('eip155:1338');
        await selectNetworkDialog.openEditNetworkModal();

        // Remove the second RPC
        const editNetworkModal = new AddEditNetworkModal(driver);
        await editNetworkModal.checkPageIsLoaded();
        await editNetworkModal.removeRPCInEditNetworkModal(2);
        await editNetworkModal.checkRpcIsDisplayed('127.0.0.1:8546', false);

        // Save the edited network
        await editNetworkModal.saveEditedNetwork();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();

        const afterPermittedChains = await getPermittedChains(driver);
        assert.deepEqual(afterPermittedChains, ['0x539', '0x53a']);
      },
    );
  });
});
