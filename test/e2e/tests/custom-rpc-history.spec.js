const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, largeDelayMs } = require('../helpers');

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
        fixtures: 'imported-account',
        ganacheOptions: { ...ganacheOptions, concurrent: { port, chainId } },
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        const rpcUrl = `http://127.0.0.1:${port}`;
        const networkName = 'Secondary Ganache Testnet';

        await driver.delay(largeDelayMs);

        await driver.clickElement('.network-display');

        await driver.clickElement({ text: 'Add Network', tag: 'button' });

        await driver.findElement('.networks-tab__sub-header-text');

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
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // duplicate network
        const duplicateRpcUrl = 'https://mainnet.infura.io/v3/';

        await driver.delay(largeDelayMs);

        await driver.clickElement('.network-display');

        await driver.clickElement({ text: 'Add Network', tag: 'button' });

        await driver.findElement('.networks-tab__sub-header-text');

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
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // duplicate network
        const newRpcUrl = 'http://localhost:8544';
        const duplicateChainId = '0x539';

        await driver.delay(largeDelayMs);

        await driver.clickElement('.network-display');

        await driver.clickElement({ text: 'Add Network', tag: 'button' });

        await driver.findElement('.networks-tab__sub-header-text');

        const customRpcInputs = await driver.findElements('input[type="text"]');
        const rpcUrlInput = customRpcInputs[2];
        const chainIdInput = customRpcInputs[3];

        await chainIdInput.clear();
        await chainIdInput.sendKeys(duplicateChainId);
        await driver.findElement({
          text:
            'This Chain ID is currently used by the Localhost 8545 network.',
          tag: 'h6',
        });

        await rpcUrlInput.clear();
        await rpcUrlInput.sendKeys(newRpcUrl);

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
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.delay(largeDelayMs);

        await driver.clickElement('.network-display');

        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'span' });
      },
    );
  });

  it('finds all recent RPCs in history', async function () {
    await withFixtures(
      {
        fixtures: 'custom-rpc',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.delay(largeDelayMs);
        await driver.clickElement('.network-display');

        // only recent 3 are found and in correct order (most recent at the top)
        const customRpcs = await driver.findElements({
          text: 'http://127.0.0.1:8545/',
          tag: 'span',
        });

        // click Mainnet to dismiss network dropdown
        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'span' });

        assert.equal(customRpcs.length, 2);
      },
    );
  });

  it('deletes a custom RPC', async function () {
    await withFixtures(
      {
        fixtures: 'custom-rpc',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.delay(largeDelayMs);
        await driver.clickElement('.network-display');

        await driver.clickElement({ text: 'Add Network', tag: 'button' });

        await driver.findVisibleElement('.settings-page__content');
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

        await driver.clickElement('.btn-danger');

        // wait for confirm delete modal to be visible
        const confirmDeleteModal = await driver.findVisibleElement(
          'span .modal',
        );

        await driver.clickElement(
          '.button.btn-danger-primary.modal-container__footer-button',
        );

        // wait for confirm delete modal to be removed from DOM.
        await confirmDeleteModal.waitForElementState('hidden');

        const newNetworkListItems = await driver.findElements(
          '.networks-tab__networks-list-name',
        );

        assert.equal(networkListItems.length - 1, newNetworkListItems.length);
      },
    );
  });
});
