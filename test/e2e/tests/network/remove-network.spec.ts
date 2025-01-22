import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  regularDelayMs,
  tinyDelayMs,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { Mockttp } from '../../mock-e2e';

describe('Remove Network:', function (this: Suite) {
  it('should remove the chainId from existing permissions when a network configuration is removed entirely', async function () {
  });

  it('should not remove the chainId from existing permissions when a network client is removed but other network clients still exist for the chainId', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
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
                chainId: '0xa4b1',
                id: '2ce66016-8aab-47df-b27f-318c80865eb0',
                nickname: 'Arbitrum mainnet',
                rpcPrefs: {},
                rpcUrl: 'https://arbitrum-mainnet.infura.io',
                ticker: 'ETH',
              },
              '2ce66016-8aab-47df-b27f-318c80865eb1': {
                chainId: '0xa4b1',
                id: '2ce66016-8aab-47df-b27f-318c80865eb1',
                nickname: 'Arbitrum mainnet 2',
                rpcPrefs: {},
                rpcUrl: 'https://responsive-rpc.test/',
                ticker: 'ETH',
              },
            },
            selectedNetworkClientId: 'networkConfigurationId',
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        // Avoid a stale element error
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="network-display"]');

        // Go to Edit Menu
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-0xa4b1"]',
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
          text: 'responsive-rpc.test',
          tag: 'p',
        });

        // Delete it
        await driver.clickElement('[data-testid="delete-item-1"]');

        // Verify it went away
        await driver.assertElementNotPresent({
          text: 'responsive-rpc.test',
          tag: 'p',
        });

        // Save the network
        await driver.clickElement(selectors.saveButton);

        //  Re-open the network menu
        await driver.delay(regularDelayMs);
        // We need to use clickElementSafe + assertElementNotPresent as sometimes the network dialog doesn't appear, as per this issue (#27870)
        // TODO: change the 2 actions for clickElementAndWaitToDisappear, once the issue is fixed
        await driver.clickElementSafe({ text: 'Got it', tag: 'h6' });
        await driver.assertElementNotPresent({
          tag: 'h6',
          text: 'Got it',
        });
        await driver.clickElement('[data-testid="network-display"]');

        // Go back to edit the network
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-0xa4b1"]',
        );
        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="network-list-item-options-edit"]',
        );

        // Verify the rpc endpoint is still deleted
        await driver.clickElement('[data-testid="test-add-rpc-drop-down"]');
        await driver.assertElementNotPresent({
          text: 'responsive-rpc.test',
          tag: 'p',
        });
      },
    );
  });
});
