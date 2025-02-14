import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  CaveatConstraint,
  PermissionConstraint,
} from '@metamask/permission-controller';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  openDapp,
  regularDelayMs,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { PermissionNames } from '../../../../app/scripts/controllers/permissions';
import { CaveatTypes } from '../../../../shared/constants/permissions';

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
        localNodeOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        const beforePermittedChains = await getPermittedChains(driver);

        assert.deepEqual(beforePermittedChains, ['0x539', '0x53a']);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Avoid a stale element error
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="network-display"]');

        // Go to Edit Menu
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-0x53a"]',
        );

        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="network-list-item-options-delete"]',
        );

        await driver.delay(regularDelayMs);
        await driver.clickElement({ text: 'Delete', tag: 'button' });

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
        localNodeOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        const beforePermittedChains = await getPermittedChains(driver);

        assert.deepEqual(beforePermittedChains, ['0x539', '0x53a']);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Avoid a stale element error
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="network-display"]');

        // Go to Edit Menu
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-0x53a"]',
        );

        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="network-list-item-options-edit"]',
        );

        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="test-add-rpc-drop-down"]');
        await driver.delay(regularDelayMs);

        // Assert the endpoint is in the list
        await driver.findElement({
          text: '127.0.0.1:8546',
          tag: 'p',
        });

        // Delete it
        await driver.clickElement('[data-testid="delete-item-1"]');

        // Verify it went away
        await driver.assertElementNotPresent({
          text: '127.0.0.1:8546',
          tag: 'p',
        });

        // Save the network
        await driver.clickElement({ text: 'Save', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const afterPermittedChains = await getPermittedChains(driver);

        assert.deepEqual(afterPermittedChains, ['0x539', '0x53a']);
      },
    );
  });
});
