import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import AddEditNetworkModal from '../../page-objects/pages/dialog/add-edit-network';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../page-objects/flows/network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { getPermittedChains } from './common';

describe('Remove Network:', function (this: Suite) {
  it('should remove the chainId from existing permissions when a network configuration is removed entirely', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDappWithChains([
            '0x539',
            '0x53a',
          ])
          .withNetworkController({
            providerConfig: {
              rpcPrefs: { blockExplorerUrl: 'https://etherscan.io/' },
            },
            networkConfigurations: {
              networkConfigurationId: {
                chainId: '0x539',
                nickname: 'Localhost 8545',
                rpcUrl: 'http://localhost:8545',
                ticker: 'ETH',
                rpcPrefs: { blockExplorerUrl: 'https://etherscan.io/' },
              },
              '2ce66016-8aab-47df-b27f-318c80865eb0': {
                chainId: '0x53a',
                id: '2ce66016-8aab-47df-b27f-318c80865eb0',
                nickname: 'Localhost 8546',
                rpcPrefs: {},
                rpcUrl: 'http://localhost:8546',
                ticker: 'ETH',
              },
            },
            selectedNetworkClientId: 'networkConfigurationId',
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
        await switchToEditRPCViaGlobalMenuNetworks(driver);

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
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDappWithChains([
            '0x539',
            '0x53a',
          ])
          .withNetworkController({
            providerConfig: {
              rpcPrefs: { blockExplorerUrl: 'https://etherscan.io/' },
            },
            networkConfigurations: {
              networkConfigurationId: {
                chainId: '0x539',
                nickname: 'Localhost 8545',
                rpcUrl: 'http://localhost:8545',
                ticker: 'ETH',
                rpcPrefs: { blockExplorerUrl: 'https://etherscan.io/' },
              },
              '2ce66016-8aab-47df-b27f-318c80865eb0': {
                chainId: '0x53a',
                id: '2ce66016-8aab-47df-b27f-318c80865eb0',
                nickname: 'Localhost 8546',
                rpcPrefs: {},
                rpcUrl: 'http://localhost:8546',
                ticker: 'ETH',
              },
              '2ce66016-8aab-47df-b27f-318c80865eb1': {
                chainId: '0x53a',
                id: '2ce66016-8aab-47df-b27f-318c80865eb1',
                nickname: 'Localhost 8546 alternative',
                rpcPrefs: {},
                rpcUrl: 'http://127.0.0.1:8546',
                ticker: 'ETH',
              },
            },
            selectedNetworkClientId: 'networkConfigurationId',
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
        await switchToEditRPCViaGlobalMenuNetworks(driver);

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
