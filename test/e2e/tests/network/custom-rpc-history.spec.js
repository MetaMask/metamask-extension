const { strict: assert } = require('assert');
const { mockNetworkStateOld } = require('../../../stub/networks');

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

        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement({
          text: 'Add a custom network',
          tag: 'button',
        });

        await driver.fill(
          '[data-testid="network-form-network-name"]',
          networkName,
        );
        await driver.fill(
          '[data-testid="network-form-chain-id"]',
          chainId.toString(),
        );
        await driver.fill('[data-testid="network-form-ticker-input"]', symbol);

        // Add rpc url
        const rpcUrlInputDropDown = await driver.waitForSelector(
          '[data-testid="test-add-rpc-drop-down"]',
        );
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
        await rpcNameInput.sendKeys('test-name');

        await driver.clickElement({
          text: 'Add URL',
          tag: 'button',
        });

        await driver.clickElement({ text: 'Save', tag: 'button' });

        await driver.findElement({ text: networkName, tag: 'h6' });

        // Validate the network was added
        const networkAdded = await driver.isElementPresent({
          text: '“Secondary Ganache Testnet” was successfully added!',
        });
        assert.equal(
          networkAdded,
          true,
          '“Secondary Ganache Testnet” was successfully added!',
        );
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

        // Add rpc url
        const rpcUrlInputDropDown = await driver.waitForSelector(
          '[data-testid="test-add-rpc-drop-down"]',
        );
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
        await rpcNameInput.sendKeys('test-name');

        await driver.clickElement({
          text: 'Add URL',
          tag: 'button',
        });

        await driver.fill('[data-testid="network-form-chain-id"]', '1');

        await driver.findElement({
          text: 'This Chain ID is currently used by the Ethereum Mainnet network.',
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
        const duplicateChainId = '1';

        await driver.assertElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({
          text: 'Add a custom network',
          tag: 'button',
        });

        await driver.fill(
          '[data-testid="network-form-chain-id"]',
          duplicateChainId,
        );

        await driver.findElement({
          text: 'This Chain ID is currently used by the Ethereum Mainnet network.',
        });

        // Add invalid rcp url
        const rpcUrlInputDropDown = await driver.waitForSelector(
          '[data-testid="test-add-rpc-drop-down"]',
        );
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
        await rpcUrlInput.sendKeys('test');

        const rpcNameInput = await driver.waitForSelector(
          '[data-testid="rpc-name-input-test"]',
        );
        await rpcNameInput.sendKeys('test-name');

        await driver.findElement({
          text: 'URLs require the appropriate HTTP/HTTPS prefix.',
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
    const networkState = mockNetworkStateOld(
      {
        rpcUrl: 'http://127.0.0.1:8545/1',
        chainId: '0x539',
        ticker: 'ETH',
        nickname: 'http://127.0.0.1:8545/1',
      },
      {
        rpcUrl: 'http://127.0.0.1:8545/2',
        chainId: '0x539',
        ticker: 'ETH',
        nickname: 'http://127.0.0.1:8545/2',
      },
    );
    delete networkState.selectedNetworkClientId;

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController(networkState)
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
          text: 'Localhost 8545',
          tag: 'p',
        });

        // click Mainnet to dismiss network dropdown
        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });

        // custom rpcs length is 1 because networks has been merged
        assert.equal(customRpcs.length, 1);
      },
    );
  });

  it('deletes a custom RPC', async function () {
    const networkState = mockNetworkStateOld(
      {
        rpcUrl: 'http://127.0.0.1:8545/1',
        chainId: '0x539',
        ticker: 'ETH',
        nickname: 'http://127.0.0.1:8545/1',
      },
      {
        rpcUrl: 'http://127.0.0.1:8545/2',
        chainId: '0x540',
        ticker: 'ETH',
        nickname: 'http://127.0.0.1:8545/2',
      },
    );
    delete networkState.selectedNetworkClientId;

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController(networkState)
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.assertElementNotPresent('.loading-overlay');
        // Click add network from network options
        await driver.clickElement('[data-testid="network-display"]');

        const customNetworkName = 'http://127.0.0.1:8545/2';
        const networkItemClassName = '.multichain-network-list-item';

        const networkListItems = await driver.findClickableElements(
          networkItemClassName,
        );

        // click on menu button
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-0x540"]',
        );

        // click on delere button
        await driver.clickElement(
          '[data-testid="network-list-item-options-delete"]',
        );

        // click on delete button
        await driver.clickElement({
          text: 'Delete',
          tag: 'button',
        });

        await driver.assertElementNotPresent(
          '[data-testid="confirm-delete-network-modal"]',
        );

        // There's a short slot to process deleting the network,
        // hence there's a need to wait for the element to be removed to guarantee the action is executed completely
        await driver.assertElementNotPresent({
          tag: 'div',
          text: customNetworkName,
        });

        // Click add network from network options
        await driver.clickElement('[data-testid="network-display"]');

        // custom network http://127.0.0.1:8545/2 is removed from network list
        const newNetworkListItems = await driver.findElements(
          networkItemClassName,
        );

        assert.equal(networkListItems.length - 1, newNetworkListItems.length);
      },
    );
  });
});
