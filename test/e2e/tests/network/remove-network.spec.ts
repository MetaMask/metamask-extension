import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  CaveatConstraint,
  PermissionConstraint,
} from '@metamask/permission-controller';
import FixtureBuilder from '../../fixture-builder';
import {
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { PermissionNames } from '../../../../app/scripts/controllers/permissions';
import { CaveatTypes } from '../../../../shared/constants/permissions';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AddEditNetworkModal from '../../page-objects/pages/dialog/add-edit-network';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';

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
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetwork = new SelectNetwork(driver);

        await unlockWallet(driver);
        await openDapp(driver);

        const beforePermittedChains = await getPermittedChains(driver);

        assert.deepEqual(beforePermittedChains, ['0x539', '0x53a']);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Open the network dropdown
        await headerNavbar.clickSwitchNetworkDropDown();

        // Delete the network
        await selectNetwork.deleteNetwork('eip155:1338');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

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
        const headerNavbar = new HeaderNavbar(driver);
        const addEditNetworkModal = new AddEditNetworkModal(driver);
        const selectNetwork = new SelectNetwork(driver);

        await unlockWallet(driver);
        await openDapp(driver);

        const beforePermittedChains = await getPermittedChains(driver);

        assert.deepEqual(beforePermittedChains, ['0x539', '0x53a']);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Go to Edit Menu
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.openNetworkListOptions('eip155:1338');
        await selectNetwork.openEditNetworkModal();
        await addEditNetworkModal.clickRpcDropDown();

        // Assert the endpoint is in the list
        await addEditNetworkModal.check_rpcIsDisplayed('127.0.0.1:8546');

        // Remove the RPC endpoint
        await addEditNetworkModal.removeRPCInEditNetworkModal(2);

        // Verify it went away
        await addEditNetworkModal.checkRpcIsNotDisplayed('127.0.0.1:8546');

        // Save the network
        await addEditNetworkModal.saveEditedNetwork();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const afterPermittedChains = await getPermittedChains(driver);

        assert.deepEqual(afterPermittedChains, ['0x539', '0x53a']);
      },
    );
  });
});
