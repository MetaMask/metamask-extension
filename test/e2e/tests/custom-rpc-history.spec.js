const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  generateGanacheOptions,
  withFixtures,
  regularDelayMs,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Custom RPC history', function () {
  it(`creates first custom RPC entry`, async function () {
    const port = 8546;
    const chainId = 1338;
    const symbol = 'TEST';
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: generateGanacheOptions({
          concurrent: { port, chainId },
        }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const rpcUrl = `http://127.0.0.1:${port}`;
        const networkName = 'Secondary Ganache Testnet';

        await driver.assertElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ text: 'Add network', tag: 'button' });

        await driver.findElement('.add-network__networks-container');

        await driver.clickElement({
          text: 'Add a network manually',
          tag: 'h6',
        });

        await driver.findElement('.networks-tab__subheader');

        const customRpcInputs = await driver.findElements('input[type="text"]');
        const networkNameInput = customRpcInputs[1];
        const rpcUrlInput = customRpcInputs[2];
        const chainIdInput = customRpcInputs[3];
        const symbolInput = customRpcInputs[4];

        await networkNameInput.clear();
        await networkNameInput.sendKeys(networkName);

        await rpcUrlInput.clear();
        await rpcUrlInput.sendKeys(rpcUrl);

        await chainIdInput.clear();
        await chainIdInput.sendKeys(chainId.toString());

        await symbolInput.clear();
        await symbolInput.sendKeys(symbol);

        await driver.clickElement(
          '.networks-tab__add-network-form-footer .btn-primary',
        );

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

        await driver.clickElement({ text: 'Add network', tag: 'button' });

        await driver.findElement('.add-network__networks-container');

        await driver.clickElement({
          text: 'Add a network manually',
          tag: 'h6',
        });

        await driver.findElement('.networks-tab__subheader');

        const customRpcInputs = await driver.findElements('input[type="text"]');
        const rpcUrlInput = customRpcInputs[2];

        await rpcUrlInput.clear();
        await rpcUrlInput.sendKeys(duplicateRpcUrl);
        await driver.findElement({
          text: 'This URL is currently used by the mainnet network.',
          tag: 'h6',
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

        await driver.clickElement({ text: 'Add network', tag: 'button' });

        await driver.findElement('.add-network__networks-container');

        await driver.clickElement({
          text: 'Add a network manually',
          tag: 'h6',
        });

        await driver.findElement('.networks-tab__subheader');

        const customRpcInputs = await driver.findElements('input[type="text"]');
        const rpcUrlInput = customRpcInputs[2];
        const chainIdInput = customRpcInputs[3];

        await chainIdInput.clear();
        await chainIdInput.sendKeys(duplicateChainId);
        await driver.findElement({
          text: 'This Chain ID is currently used by the mainnet network.',
          tag: 'h6',
        });

        await rpcUrlInput.clear();

        // We cannot use sendKeys() here, because a network request will be fired after each
        // keypress, and the privacy snapshot will show:
        // `New hosts found: l,lo,loc,loca,local,localh,localho,localhos`
        // In the longer term, we may want to debounce this
        await driver.pasteIntoField(
          '.form-field:nth-of-type(2) input[type="text"]',
          newRpcUrl,
        );

        await driver.findElement({
          text: 'Could not fetch chain ID. Is your RPC URL correct?',
          tag: 'h6',
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

        await driver.clickElement('.toggle-button');

        await driver.delay(regularDelayMs);

        // only recent 3 are found and in correct order (most recent at the top)
        const customRpcs = await driver.findElements({
          text: 'http://127.0.0.1:8545/',
          tag: 'div',
        });

        // click Mainnet to dismiss network dropdown
        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });

        assert.equal(customRpcs.length, 2);
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
        await unlockWallet(driver);

        await driver.assertElementNotPresent('.loading-overlay');
        // Click add network from network options
        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement({ text: 'Add network', tag: 'button' });
        // Open network settings page
        await driver.findElement('.add-network__networks-container');
        // Click Add network manually to trigger form
        await driver.clickElement({
          text: 'Add a network manually',
          tag: 'h6',
        });
        // cancel new custom rpc
        await driver.clickElement(
          '.networks-tab__add-network-form-footer button.btn-secondary',
        );
        // find custom network http://127.0.0.1:8545/2
        const networkItemClassName = '.networks-tab__networks-list-name';
        const customNetworkName = 'http://127.0.0.1:8545/2';
        const networkListItems = await driver.findClickableElements(
          networkItemClassName,
        );
        const lastNetworkListItem =
          networkListItems[networkListItems.length - 1];
        await lastNetworkListItem.click();
        await driver.waitForSelector({
          css: '.form-field .form-field__input:nth-of-type(1)',
          value: customNetworkName,
        });
        // delete custom network in a modal
        await driver.clickElement('.networks-tab__network-form .btn-danger');
        await driver.findVisibleElement(
          '[data-testid="confirm-delete-network-modal"]',
        );
        await driver.clickElement({ text: 'Delete', tag: 'button' });
        await driver.assertElementNotPresent(
          '[data-testid="confirm-delete-network-modal"]',
        );
        // There's a short slot to process deleting the network,
        // hence there's a need to wait for the element to be removed to guarantee the action is executed completely
        await driver.assertElementNotPresent({
          tag: 'div',
          text: customNetworkName,
        });

        // custom network http://127.0.0.1:8545/2 is removed from network list
        const newNetworkListItems = await driver.findElements(
          networkItemClassName,
        );

        assert.equal(networkListItems.length - 1, newNetworkListItems.length);
      },
    );
  });
});
