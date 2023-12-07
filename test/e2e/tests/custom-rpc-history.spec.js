const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  regularDelayMs,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Stores custom RPC history', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it(`creates first custom RPC entry`, async function () {
    const port = 8546;
    const chainId = 1338;
    const symbol = 'TEST';
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: { ...ganacheOptions, concurrent: { port, chainId } },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const rpcUrl = `http://127.0.0.1:${port}`;
        const networkName = 'Secondary Ganache Testnet';

        await driver.waitForElementNotPresent('.loading-overlay');
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

        await driver.findElement({ text: networkName, tag: 'span' });
      },
    );
  });

  it('warns user when they enter url for an already configured network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // duplicate network
        const duplicateRpcUrl = 'https://mainnet.infura.io/v3/';

        await driver.waitForElementNotPresent('.loading-overlay');
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
        ganacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // duplicate network
        const newRpcUrl = 'http://localhost:8544';
        const duplicateChainId = '1';

        await driver.waitForElementNotPresent('.loading-overlay');
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
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.waitForElementNotPresent('.loading-overlay');
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
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.waitForElementNotPresent('.loading-overlay');
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
        ganacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.waitForElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ text: 'Add network', tag: 'button' });

        await driver.findElement('.add-network__networks-container');

        await driver.clickElement({
          text: 'Add a network manually',
          tag: 'h6',
        });

        // // cancel new custom rpc
        await driver.clickElement(
          '.networks-tab__add-network-form-footer button.btn-secondary',
        );

        const networkListItems = await driver.findClickableElements(
          '.networks-tab__networks-list-name',
        );
        const lastNetworkListItem =
          networkListItems[networkListItems.length - 1];
        await lastNetworkListItem.click();

        await driver.waitForSelector({
          css: '.form-field .form-field__input:nth-of-type(1)',
          value: 'http://127.0.0.1:8545/2',
        });

        await driver.clickElement('.btn-danger');

        // wait for confirm delete modal to be visible
        await driver.findVisibleElement('span .modal');

        await driver.clickElement(
          '.button.btn-danger-primary.modal-container__footer-button',
        );

        await driver.waitForElementNotPresent('span .modal');

        const newNetworkListItems = await driver.findElements(
          '.networks-tab__networks-list-name',
        );

        assert.equal(networkListItems.length - 1, newNetworkListItems.length);
      },
    );
  });
});
