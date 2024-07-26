import { delay } from 'lodash';

const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  generateGanacheOptions,
  withFixtures,
  regularDelayMs,
  unlockWallet,
  tinyDelayMs,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Custom RPC history', function () {
  it(`creates first custom RPC entry`, async function () {
    const port = 8546;
    const chainId = 1338;
    const symbol = 'TEST';
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: generateGanacheOptions({
          concurrent: [{ port, chainId }],
        }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const rpcUrl = `http://127.0.0.1:${port}`;
        const networkName = 'Secondary Ganache Testnet';

        await driver.assertElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({
          text: 'Add a custom network',
          tag: 'button',
        });

        // fill the add network form
        const networkNameInput = await driver.waitForSelector(
          '[data-testid="network-form-network-name"]',
        );

        const rpcUrlInputDropDown = await driver.waitForSelector(
          '[data-testid="test-add-rpc-drop-down"]',
        );

        const symbolInput = await driver.waitForSelector(
          '[data-testid="network-form-ticker-input"]',
        );

        await symbolInput.clear();
        await symbolInput.sendKeys(symbol);

        await networkNameInput.clear();
        await networkNameInput.sendKeys(networkName);

        // Add rpc URL
        await rpcUrlInputDropDown.click();
        await driver.delay(tinyDelayMs);
        await driver.clickElement({
          text: 'Add RPC URL',
          tag: 'button',
        });

        const rpcUrlInput = await driver.waitForSelector(
          '[data-testid="rpc-url-input-test"]',
        );
        await rpcUrlInput.clear();
        await rpcUrlInput.sendKeys(rpcUrl);

        const rpcNameInput = await driver.waitForSelector(
          '[data-testid="rpc-name-input-test"]',
        );
        await rpcNameInput.sendKeys(networkName);

        await driver.delay(tinyDelayMs);

        await driver.clickElement({
          text: 'Add URL',
          tag: 'button',
        });
        await driver.delay(tinyDelayMs);
        // end add rpc URL

        await driver.clickElement({
          text: 'Save',
          tag: 'button',
        });
        await driver.delay(tinyDelayMs);

        await driver.findElement({ text: networkName, tag: 'h6' });
      },
    );
  });

  it('warns user when they enter url for an already configured network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // duplicate network
        const duplicateRpcUrl = 'https://mainnet.infura.io/v3/';

        await driver.assertElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({
          text: 'Add a custom network',
          tag: 'button',
        });

        const rpcUrlInputDropDown = await driver.waitForSelector(
          '[data-testid="test-add-rpc-drop-down"]',
        );

        // Add rpc URL
        await rpcUrlInputDropDown.click();
        await driver.delay(tinyDelayMs);
        await driver.clickElement({
          text: 'Add RPC URL',
          tag: 'button',
        });

        const rpcUrlInput = await driver.waitForSelector(
          '[data-testid="rpc-url-input-test"]',
        );
        await rpcUrlInput.clear();
        await rpcUrlInput.sendKeys(duplicateRpcUrl);

        const rpcNameInput = await driver.waitForSelector(
          '[data-testid="rpc-name-input-test"]',
        );
        await rpcNameInput.sendKeys('test');

        await driver.delay(tinyDelayMs);

        await driver.clickElement({
          text: 'Add URL',
          tag: 'button',
        });

        await driver.findElement({
          text: 'This Chain ID is currently used by the Localhost 8545 network.',
        });
      },
    );
  });

  it('warns user when they enter chainId for an already configured network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // duplicate network
        const newRpcUrl = 'http://localhost:8544';
        const duplicateChainId = '1';

        await driver.assertElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({
          text: 'Add a custom network',
          tag: 'button',
        });

        const rpcUrlInputDropDown = await driver.waitForSelector(
          '[data-testid="test-add-rpc-drop-down"]',
        );

        const chainIdInput = await driver.waitForSelector(
          '[data-testid="network-form-chain-id"]',
        );

        await chainIdInput.clear();
        await chainIdInput.sendKeys(duplicateChainId);

        await driver.findElement({
          text: 'This Chain ID is currently used by the Ethereum Mainnet network.',
        });

        await rpcUrlInputDropDown.click();
        await driver.delay(tinyDelayMs);
        await driver.clickElement({
          text: 'Add RPC URL',
          tag: 'button',
        });

        const rpcUrlInput = await driver.waitForSelector(
          '[data-testid="rpc-url-input-test"]',
        );
        await rpcUrlInput.clear();
        await rpcUrlInput.sendKeys(newRpcUrl);

        const rpcNameInput = await driver.waitForSelector(
          '[data-testid="rpc-name-input-test"]',
        );
        await rpcNameInput.sendKeys('test');

        await driver.delay(tinyDelayMs);

        await driver.clickElement({
          text: 'Add URL',
          tag: 'button',
        });

        await driver.findElement({
          text: 'Could not fetch chain ID. Is your RPC URL correct?',
        });
      },
    );
  });

  it('selects another provider', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.assertElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });
      },
    );
  });

  it('finds all recent RPCs in history', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController({
            networkConfigurations: {
              networkConfigurationIdOne: {
                rpcUrl: 'http://127.0.0.1:8545/1',
                chainId: '0x539',
                ticker: 'ETH',
                nickname: 'http://127.0.0.1:8545/1',
                rpcPrefs: {},
                type: 'rpc',
              },
              networkConfigurationIdTwo: {
                rpcUrl: 'http://127.0.0.1:8545/2',
                chainId: '0x539',
                ticker: 'ETH',
                nickname: 'http://127.0.0.1:8545/2',
                rpcPrefs: {},
                type: 'rpc',
              },
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.assertElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="network-display"]');

        const toggleButton = await driver.findElement(
          '[data-testid="testnet-toggle"]',
        );

        await driver.scrollToElement(toggleButton);
        await driver.delay(regularDelayMs);

        await driver.findElements({
          text: 'Localhost 8545',
          tag: 'p',
        });

        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });
      },
    );
  });

  it('deletes a custom RPC', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController({
            networkConfigurations: {
              networkConfigurationIdOne: {
                rpcUrl: 'http://127.0.0.1:8545/1',
                chainId: '0x539',
                ticker: 'ETH',
                nickname: 'http://127.0.0.1:8545/1',
                rpcPrefs: {},
              },
              networkConfigurationIdTwo: {
                rpcUrl: 'http://127.0.0.1:8545/2',
                chainId: '0x539',
                ticker: 'ETH',
                nickname: 'http://127.0.0.1:8545/2',
                rpcPrefs: {},
              },
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        const customNetworkName = 'http://127.0.0.1:8545/2';

        await unlockWallet(driver);
        await driver.assertElementNotPresent('.loading-overlay');
        // Click add network from network options
        await driver.clickElement('[data-testid="network-display"]');

        // Go to Edit Menu
        const toggleButton = await driver.findElement(
          '[data-testid="testnet-toggle"]',
        );
        await driver.scrollToElement(toggleButton);
        const networkMenu = await driver.findElement(
          '[data-testid="network-list-item-options-button-0x539"]',
        );
        await networkMenu.click();

        // find custom network http://127.0.0.1:8545/2
        const editButton = await driver.findElement(
          '[data-testid="network-list-item-options-edit"]',
        );
        editButton.click();
        const dropDownRpcMenu = await driver.findElement(
          '[data-testid="test-add-rpc-drop-down"]',
        );
        dropDownRpcMenu.click();

        const networkListItems = await driver.findElements(
          '[data-testid="network-element"]',
        );
        // delete the custom rpc
        const deleteRpcButton = await driver.findElement(
          '[data-testid="network-list-item-delete-button-1"]',
        );
        deleteRpcButton.click();

        // custom network http://127.0.0.1:8545/2 is removed from network list
        await driver.assertElementNotPresent({
          tag: 'div',
          text: customNetworkName,
        });
        const newNetworkListItems = await driver.findElements(
          '[data-testid="network-element"]',
        );
        assert.equal(networkListItems.length - 1, newNetworkListItems.length);
      },
    );
  });
});
