const { strict: assert } = require('assert');
const { toHex } = require('@metamask/controller-utils');
const FixtureBuilder = require('../../fixture-builder');
const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  openMenuSafe,
  regularDelayMs,
  unlockWallet,
  WINDOW_TITLES,
  tinyDelayMs,
} = require('../../helpers');

const TEST_CHAIN_ID = toHex(100);
const TEST_COLLISION_CHAIN_ID = toHex(78);

const MOCK_CHAINLIST_RESPONSE = [
  {
    name: 'Ethereum Mainnet',
    chain: 'ETH',
    icon: 'ethereum',
    rpc: [
      'https://mainnet.infura.io/v3/<INFURA_API_KEY>',
      'wss://mainnet.infura.io/ws/v3/<INFURA_API_KEY?',
      'https://api.mycryptoapi.com/eth',
      'https://cloudflare-eth.com',
      'https://ethereum.publicnode.com',
    ],
    features: [
      {
        name: 'EIP155',
      },
      {
        name: 'EIP1559',
      },
    ],
    faucets: [],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    infoURL: 'https://ethereum.org',
    shortName: 'eth',
    chainId: 1,
    networkId: 1,
    slip44: 60,
    ens: {
      registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    },
    explorers: [
      {
        name: 'etherscan',
        url: 'https://etherscan.io',
        standard: 'EIP3091',
      },
      {
        name: 'blockscout',
        url: 'https://eth.blockscout.com',
        icon: 'blockscout',
        standard: 'EIP3091',
      },
    ],
  },
];

const selectors = {
  accountOptionsMenuButton: '[data-testid="account-options-menu-button"]',
  informationSymbol: '[data-testid="info-tooltip"]',
  settingsOption: '[data-testid="global-menu-settings"]',
  networkOption: { text: 'Networks', tag: 'div' },
  addNetwork: { text: 'Add a network', tag: 'button' },
  addNetworkManually: { text: 'Add a network manually', tag: 'h6' },
  generalOption: { text: 'General', tag: 'div' },
  generalTabHeader: { text: 'General', tag: 'h4' },
  ethereumNetwork: { text: 'Ethereum Mainnet', tag: 'div' },
  newUpdateNetwork: { text: 'Update Network', tag: 'div' },
  deleteButton: { text: 'Delete', tag: 'button' },
  cancelButton: { text: 'Cancel', tag: 'button' },
  saveButton: { text: 'Save', tag: 'button' },
  updatedNetworkDropDown: { tag: 'span', text: 'Update Network' },
  errorMessageInvalidUrl: {
    text: 'URLs require the appropriate HTTP/HTTPS prefix.',
  },
  warningSymbol: {
    text: 'URLs require the appropriate HTTP/HTTPS prefix.',
  },
  suggestedTicker: '[data-testid="network-form-ticker-suggestion"]',
  tickerWarning: '[data-testid="network-form-ticker-warning"]',
  suggestedTickerForXDAI: {
    css: '[data-testid="network-form-ticker-suggestion"]',
    text: 'Suggested currency symbol: XDAI',
  },
  tickerWarningTokenSymbol: {
    css: '[data-testid="network-form-ticker-warning"]',
    text: "This token symbol doesn't match the network name or chain ID entered. Many popular tokens use similar symbols, which scammers can use to trick you into sending them a more valuable token in return. Verify everything before you continue.",
  },
  tickerButton: { text: 'PETH', tag: 'button' },
  networkAdded: { text: 'Network added successfully!' },

  networkNameInputField: '[data-testid="network-form-network-name"]',
  networkNameInputFieldSetToEthereumMainnet: {
    xpath:
      "//input[@data-testid = 'network-form-network-name'][@value = 'Ethereum Mainnet']",
  },
  rpcUrlInputField: '[data-testid="network-form-rpc-url"]',
  chainIdInputField: '[data-testid="network-form-chain-id"]',
  tickerInputField: '[data-testid="network-form-ticker-input"]',
  explorerInputField: '[data-testid="network-form-block-explorer-url"]',
  errorContainer: '.settings-tab__error',
};

const inputData = {
  networkName: 'Collision network',
  rpcUrl: 'https://responsive-rpc.test/',
  chainId: '78',
  ticker: 'TST',
};

describe('Custom network', function () {
  const chainID = '42161';
  const networkURL = 'https://arbitrum-mainnet.infura.io';
  const networkNAME = 'Arbitrum One';
  const currencySYMBOL = 'ETH';
  const blockExplorerURL = 'https://explorer.arbitrum.io';

  describe('JSON-RPC API', function () {
    it('should show warning when adding chainId 0x1(ethereum) and be followed by an wrong chainId error', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await openDapp(driver);
          await driver.executeScript(`
          var params = [{
            chainId: "0x1",
            chainName: "Fake Ethereum Network",
            nativeCurrency: {
              name: "",
              symbol: "ETH",
              decimals: 18
            },
            rpcUrls: ["https://customnetwork.test/api/customRPC"],
            blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
          }]
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params
          })
        `);

          const windowHandles = await driver.waitUntilXWindowHandles(3);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.Dialog,
            windowHandles,
          );

          // To mitigate a race condition, we wait until the 3 callout warnings appear
          await driver.waitForSelector({
            tag: 'span',
            text: 'According to our record the network name may not correctly match this chain ID.',
          });

          await driver.waitForSelector({
            tag: 'span',
            text: 'According to our records the submitted RPC URL value does not match a known provider for this chain ID.',
          });

          await driver.waitForSelector({
            tag: 'a',
            text: 'verify the network details',
          });

          await driver.clickElement({
            tag: 'button',
            text: 'Approve',
          });

          const warningTxt =
            'You are adding a new RPC provider for Ethereum Mainnet';

          await driver.findElement({
            tag: 'h4',
            text: warningTxt,
          });

          await driver.clickElement({
            tag: 'button',
            text: 'Approve',
          });

          const errMsg =
            'Chain ID returned by the custom network does not match the submitted chain ID.';
          await driver.findElement({
            tag: 'span',
            text: errMsg,
          });

          const approveBtn = await driver.findElement({
            tag: 'button',
            text: 'Approve',
          });

          assert.equal(await approveBtn.isEnabled(), false);
          await driver.clickElement({
            tag: 'button',
            text: 'Cancel',
          });
        },
      );
    });

    it("don't add bad rpc custom network", async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({ useSafeChainsListValidation: true })
            .build(),
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await openDapp(driver);
          await driver.executeScript(`
          var params = [{
            chainId: "0x123",
            chainName: "Antani",
            nativeCurrency: {
              name: "",
              symbol: "ANTANI",
              decimals: 18
            },
            rpcUrls: ["https://customnetwork.test/api/customRPC"],
            blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
          }]
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params
          })
        `);
          const windowHandles = await driver.waitUntilXWindowHandles(3);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.Dialog,
            windowHandles,
          );

          const warningMsg1 =
            'According to our record the network name may not correctly match this chain ID.';
          await driver.findElement({
            tag: 'span',
            text: warningMsg1,
          });

          const errorMsg1 =
            'The submitted currency symbol does not match what we expect for this chain ID.';
          await driver.findElement({
            tag: 'span',
            text: errorMsg1,
          });

          const errorMsg2 =
            'According to our records the submitted RPC URL value does not match a known provider for this chain ID.';
          await driver.findElement({
            tag: 'span',
            text: errorMsg2,
          });

          const errMsg1 = 'verify the network details';
          await driver.findElement({
            tag: 'a',
            text: errMsg1,
          });

          await driver.clickElement({
            tag: 'button',
            text: 'Approve',
          });

          const errMsg2 =
            'Chain ID returned by the custom network does not match the submitted chain ID.';
          await driver.findElement({
            tag: 'span',
            text: errMsg2,
          });

          const approveBtn = await driver.findElement({
            tag: 'button',
            text: 'Approve',
          });

          assert.equal(await approveBtn.isEnabled(), false);
          await driver.clickElement({
            tag: 'button',
            text: 'Cancel',
          });
        },
      );
    });

    it("don't validate bad rpc custom network when toggle is off", async function () {
      async function mockRPCURLAndChainId(mockServer) {
        return [
          await mockServer
            .forPost('https://responsive-rpc.test/')
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                id: '1694444405781',
                jsonrpc: '2.0',
                result: TEST_CHAIN_ID,
              },
            })),
        ];
      }

      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({ useSafeChainsListValidation: false })
            .build(),
          title: this.test.fullTitle(),
          testSpecificMock: mockRPCURLAndChainId,
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await openDapp(driver);
          await driver.executeScript(`
          var params = [{
            chainId: "${TEST_CHAIN_ID}",
            chainName: "Antani",
            nativeCurrency: {
              name: "",
              symbol: "ANTANI",
              decimals: 18
            },
            rpcUrls: ["https://responsive-rpc.test/"],
            blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
          }]
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params
          })
        `);
          const windowHandles = await driver.waitUntilXWindowHandles(3);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.Dialog,
            windowHandles,
          );

          await driver.clickElement({
            tag: 'button',
            text: 'Approve',
          });

          const switchNetworkBtn = await driver.findElement({
            tag: 'button',
            text: 'Switch network',
          });

          await switchNetworkBtn.click();
        },
      );
    });

    it("don't add unreachable custom network", async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await openDapp(driver);
          await driver.executeScript(`
          var params = [{
            chainId: "0x123",
            chainName: "Antani",
            nativeCurrency: {
              name: "",
              symbol: "ANTANI",
              decimals: 18
            },
            rpcUrls: ["https://doesntexist.test/customRPC"],
            blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
          }]
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params
          })
        `);
          const windowHandles = await driver.waitUntilXWindowHandles(3);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.Dialog,
            windowHandles,
          );
          await driver.clickElement({
            tag: 'button',
            text: 'Approve',
          });

          await driver.findElement({
            tag: 'span',
            text: 'Error while connecting to the custom network.',
          });

          const approveBtn = await driver.findElement({
            tag: 'button',
            text: 'Approve',
          });

          assert.equal(await approveBtn.isEnabled(), false);
          await driver.clickElement({
            tag: 'button',
            text: 'Cancel',
          });
        },
      );
    });
  });

  describe('Popular Networks List', function () {
    it('add custom network and switch the network', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          // Avoid a stale element error
          await driver.delay(regularDelayMs);

          await driver.clickElement('[data-testid="network-display"]');

          await driver.clickElement({
            tag: 'button',
            text: 'Add',
          });

          // verify network details
          const title = await driver.findElement({
            tag: 'span',
            text: 'Arbitrum One',
          });

          assert.equal(
            await title.getText(),
            'Arbitrum One',
            'Title of popup should be selected network',
          );

          const [networkName, networkUrl, chainIdElement, currencySymbol] =
            await driver.findElements('.definition-list dd');

          assert.equal(
            await networkName.getText(),
            networkNAME,
            'Network name is not correctly displayed',
          );
          assert.equal(
            await networkUrl.getText(),
            networkURL,
            'Network Url is not correctly displayed',
          );
          assert.equal(
            await chainIdElement.getText(),
            chainID.toString(),
            'Chain Id is not correctly displayed',
          );
          assert.equal(
            await currencySymbol.getText(),
            currencySYMBOL,
            'Currency symbol is not correctly displayed',
          );

          await driver.clickElement({ tag: 'a', text: 'View all details' });

          const networkDetailsLabels = await driver.findElements('dd');
          assert.equal(
            await networkDetailsLabels[8].getText(),
            blockExplorerURL,
            'Block Explorer URL is not correct',
          );

          await driver.clickElement({ tag: 'button', text: 'Close' });
          await driver.clickElement({ tag: 'button', text: 'Approve' });

          // verify network switched
          await driver.waitForSelector(
            'button[data-testid="network-display"][aria-label="Network Menu Arbitrum One"]',
          );
        },
      );
    });

    it('delete the Arbitrum network', async function () {
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
              },
              selectedNetworkClientId: 'networkConfigurationId',
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);
          // Avoid a stale element error
          await driver.delay(regularDelayMs);
          await driver.clickElement('[data-testid="network-display"]');
          // ===========================================================>

          // Go to Edit Menu
          const networkMenu = await driver.findElement(
            '[data-testid="network-list-item-options-button-0xa4b1"]',
          );

          await networkMenu.click();

          const deleteButton = await driver.findElement(
            '[data-testid="network-list-item-options-delete"]',
          );
          deleteButton.click();

          await driver.clickElement({
            tag: 'button',
            text: 'Delete',
          });

          await driver.clickElement('[data-testid="network-display"]');

          // check if arbitrm is on the list of popular network
          const popularNetworkArbitrum = await driver.findElement(
            '[data-testid="popular-network-0xa4b1"]',
          );

          const existNetwork = popularNetworkArbitrum !== undefined;
          assert.equal(existNetwork, true, 'Network is not deleted');
        },
      );
    });

    it("when the network details validation toggle is turned on, validate user inserted details against data from 'chainid.network'", async function () {
      async function mockRPCURLAndChainId(mockServer) {
        return [
          await mockServer
            .forPost('https://unresponsive-rpc.test/')
            // 502 Error communicating with upstream server
            .thenCallback(() => ({ statusCode: 502 })),

          await mockServer
            .forGet('https://chainid.network/chains.json')
            .thenCallback(() => ({
              statusCode: 200,
              json: MOCK_CHAINLIST_RESPONSE,
            })),
        ];
      }

      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
          testSpecificMock: mockRPCURLAndChainId,
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await checkThatSafeChainsListValidationToggleIsOn(driver);

          await failCandidateNetworkValidation(driver);
        },
      );
    });

    it("when the network details validation toggle is turned off, don't validate user inserted details", async function () {
      async function mockRPCURLAndChainId(mockServer) {
        return [
          await mockServer
            .forPost('https://responsive-rpc.test/')
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                id: '1694444405781',
                jsonrpc: '2.0',
                result: TEST_CHAIN_ID,
              },
            })),

          await mockServer
            .forGet('https://chainid.network/chains.json')
            .thenCallback(() => ({
              // even with an error, the test passes
              statusCode: 400,
            })),
        ];
      }

      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
          testSpecificMock: mockRPCURLAndChainId,
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await toggleOffSafeChainsListValidation(driver);

          await candidateNetworkIsNotValidated(driver);
        },
      );
    });
  });

  describe('customNetwork', function () {
    it('should add mainnet network', async function () {
      async function mockRPCURLAndChainId(mockServer) {
        return [
          await mockServer
            .forPost('https://responsive-rpc.test/')
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                id: '1694444405781',
                jsonrpc: '2.0',
                result: TEST_CHAIN_ID,
              },
            })),
        ];
      }

      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
          testSpecificMock: mockRPCURLAndChainId,
        },

        async ({ driver }) => {
          await unlockWallet(driver);
          await driver.clickElement('[data-testid="network-display"]');
          await driver.clickElement({
            text: 'Add a custom network',
            tag: 'button',
          });

          await driver.fill(selectors.networkNameInputField, 'Gnosis');
          await driver.fill(selectors.chainIdInputField, TEST_CHAIN_ID);
          await driver.fill(selectors.tickerInputField, 'XDAI');

          // Add rcp url
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
          await rpcUrlInput.sendKeys('https://responsive-rpc.test');

          const rpcNameInput = await driver.waitForSelector(
            '[data-testid="rpc-name-input-test"]',
          );
          await rpcNameInput.sendKeys('testName');

          await driver.clickElement({
            text: 'Add URL',
            tag: 'button',
          });

          // Add explorer URL
          const explorerUrlInputDropDown = await driver.waitForSelector(
            '[data-testid="test-explorer-drop-down"]',
          );

          await driver.scrollToElement(explorerUrlInputDropDown);
          await driver.delay(tinyDelayMs);

          await explorerUrlInputDropDown.click();
          await driver.delay(tinyDelayMs);

          await driver.clickElement({
            text: 'Add a block explorer URL',
            tag: 'button',
          });

          const blockExplorerInput = await driver.waitForSelector(
            '[data-testid="explorer-url-input"]',
          );
          await blockExplorerInput.clear();
          await blockExplorerInput.sendKeys('https://test.com');

          await driver.clickElement({
            text: 'Add URL',
            tag: 'button',
          });

          const suggestedTicker = await driver.isElementPresent(
            selectors.suggestedTickerForXDAI.css,
          );

          const tickerWarning = await driver.isElementPresent(
            selectors.tickerWarningTokenSymbol.css,
          );

          assert.equal(suggestedTicker, false);
          assert.equal(tickerWarning, false);

          await driver.clickElement(selectors.saveButton);

          // Validate the network was added
          const networkAdded = await driver.isElementPresent({
            text: '“Gnosis” was successfully added!',
          });
          assert.equal(networkAdded, true, '“Gnosis” was successfully added!');
        },
      );
    });

    it('should check symbol and show warnings', async function () {
      async function mockRPCURLAndChainId(mockServer) {
        return [
          await mockServer
            .forPost('https://responsive-rpc.test/')
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                id: '1694444405781',
                jsonrpc: '2.0',
                result: TEST_CHAIN_ID,
              },
            })),
        ];
      }

      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
          testSpecificMock: mockRPCURLAndChainId,
        },

        async ({ driver }) => {
          await unlockWallet(driver);

          await driver.clickElement('[data-testid="network-display"]');
          await driver.clickElement({
            text: 'Add a custom network',
            tag: 'button',
          });

          await driver.fill(
            selectors.networkNameInputField,
            'Ethereum mainnet',
          );

          await driver.fill(selectors.chainIdInputField, '1');
          await driver.fill(selectors.tickerInputField, 'TST');

          // Add rcp url
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
          await rpcUrlInput.sendKeys('https://responsive-rpc.test');

          const rpcNameInput = await driver.waitForSelector(
            '[data-testid="rpc-name-input-test"]',
          );
          await rpcNameInput.sendKeys('testName');

          await driver.clickElement({
            text: 'Add URL',
            tag: 'button',
          });

          // suggestion and warning ticker should be displayed
          await driver.waitForSelector(selectors.suggestedTicker);
          await driver.waitForSelector(selectors.tickerWarning);

          // Add explorer URL
          const explorerUrlInputDropDown = await driver.waitForSelector(
            '[data-testid="test-explorer-drop-down"]',
          );

          await driver.scrollToElement(explorerUrlInputDropDown);
          await driver.delay(tinyDelayMs);

          await explorerUrlInputDropDown.click();
          await driver.delay(tinyDelayMs);

          await driver.clickElement({
            text: 'Add a block explorer URL',
            tag: 'button',
          });

          const blockExplorerInput = await driver.waitForSelector(
            '[data-testid="explorer-url-input"]',
          );
          await blockExplorerInput.clear();
          await blockExplorerInput.sendKeys('https://test.com');

          await driver.clickElement({
            text: 'Add URL',
            tag: 'button',
          });
        },
      );
    });
    it('should add collision network', async function () {
      async function mockRPCURLAndChainId(mockServer) {
        return [
          await mockServer
            .forPost('https://responsive-rpc.test/')
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                id: '1694444405781',
                jsonrpc: '2.0',
                result: TEST_COLLISION_CHAIN_ID,
              },
            })),
        ];
      }
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
          testSpecificMock: mockRPCURLAndChainId,
        },

        async ({ driver }) => {
          await unlockWallet(driver);

          await driver.clickElement('[data-testid="network-display"]');
          await driver.clickElement({
            text: 'Add a custom network',
            tag: 'button',
          });

          await driver.fill(
            selectors.networkNameInputField,
            inputData.networkName,
          );

          await driver.fill(selectors.chainIdInputField, inputData.chainId);
          await driver.fill(selectors.tickerInputField, inputData.ticker);

          // Add rcp url
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
          await rpcUrlInput.sendKeys(inputData.rpcUrl);

          const rpcNameInput = await driver.waitForSelector(
            '[data-testid="rpc-name-input-test"]',
          );
          await rpcNameInput.sendKeys('testName');

          await driver.clickElement({
            text: 'Add URL',
            tag: 'button',
          });

          const suggestedTicker = await driver.isElementPresent(
            selectors.suggestedTicker,
          );

          const tickerWarning = await driver.isElementPresent(
            selectors.tickerWarning,
          );

          assert.equal(suggestedTicker, true);
          assert.equal(tickerWarning, true);

          driver.clickElement(selectors.tickerButton);
          driver.clickElement(selectors.saveButton);

          // Validate the network was added
          const networkAdded = await driver.isElementPresent({
            text: `“${inputData.networkName}” was successfully added!`,
          });

          assert.equal(
            networkAdded,
            true,
            `“${inputData.networkName}” was successfully added!`,
          );
        },
      );
    });
  });
});

async function checkThatSafeChainsListValidationToggleIsOn(driver) {
  const accountOptionsMenuSelector =
    '[data-testid="account-options-menu-button"]';
  await driver.waitForSelector(accountOptionsMenuSelector);
  await openMenuSafe(driver);

  const globalMenuSettingsSelector = '[data-testid="global-menu-settings"]';
  await driver.waitForSelector(globalMenuSettingsSelector);
  await driver.clickElement(globalMenuSettingsSelector);

  const securityAndPrivacyTabRawLocator = {
    text: 'Security & privacy',
    tag: 'div',
  };
  await driver.waitForSelector(securityAndPrivacyTabRawLocator);
  await driver.clickElement(securityAndPrivacyTabRawLocator);

  const useSafeChainsListValidationToggleSelector =
    '[data-testid="useSafeChainsListValidation"]';
  const useSafeChainsListValidationToggleElement = await driver.waitForSelector(
    useSafeChainsListValidationToggleSelector,
  );
  const useSafeChainsListValidationToggleState =
    await useSafeChainsListValidationToggleElement.getText();

  assert.equal(
    useSafeChainsListValidationToggleState,
    'ON',
    'Safe chains list validation toggle is off',
  );

  // return to the home screen
  const appHeaderSelector = '[data-testid="app-header-logo"]';
  await driver.waitForSelector(appHeaderSelector);
  await driver.clickElement(appHeaderSelector);
}

async function failCandidateNetworkValidation(driver) {
  const networkMenuSelector = '[data-testid="network-display"]';
  await driver.waitForSelector(networkMenuSelector);
  await driver.clickElement(networkMenuSelector);

  await driver.clickElement({ text: 'Add a custom network', tag: 'button' });

  const [
    // first element is the search input that we don't need to fill
    networkNameInputEl,
    ,
    chainIDInputEl,
  ] = await driver.findElements('input');

  await networkNameInputEl.fill('cheapETH');
  await chainIDInputEl.fill(toHex(777));
  await driver.fill('[data-testid="network-form-ticker-input"]', 'cTH');

  // Add rpc URL
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
  await rpcUrlInput.sendKeys('https://unresponsive-rpc.test');

  const rpcNameInput = await driver.waitForSelector(
    '[data-testid="rpc-name-input-test"]',
  );
  await rpcNameInput.sendKeys('testName');

  await driver.clickElement({
    text: 'Add URL',
    tag: 'button',
  });

  // Add explorer URL
  const explorerUrlInputDropDown = await driver.waitForSelector(
    '[data-testid="test-explorer-drop-down"]',
  );

  await driver.scrollToElement(explorerUrlInputDropDown);
  await explorerUrlInputDropDown.click();
  await driver.delay(tinyDelayMs);

  await driver.clickElement({
    text: 'Add a block explorer URL',
    tag: 'button',
  });

  const blockExplorerInput = await driver.waitForSelector(
    '[data-testid="explorer-url-input"]',
  );
  blockExplorerInput.clear();
  await blockExplorerInput.sendKeys('https://block-explorer.url');

  await driver.clickElement({
    text: 'Add URL',
    tag: 'button',
  });

  const chainIdValidationMessageRawLocator = {
    text: 'Could not fetch chain ID. Is your RPC URL correct?',
  };

  await driver.waitForSelector(chainIdValidationMessageRawLocator);

  const saveButtonRawLocator = {
    text: 'Save',
    tag: 'button',
  };
  const saveButtonEl = await driver.findElement(saveButtonRawLocator);
  assert.equal(await saveButtonEl.isEnabled(), false);
}

async function toggleOffSafeChainsListValidation(driver) {
  const accountOptionsMenuSelector =
    '[data-testid="account-options-menu-button"]';
  await driver.waitForSelector(accountOptionsMenuSelector);
  await driver.clickElement(accountOptionsMenuSelector);

  const globalMenuSettingsSelector = '[data-testid="global-menu-settings"]';
  await driver.waitForSelector(globalMenuSettingsSelector);
  await driver.clickElement(globalMenuSettingsSelector);

  const securityAndPrivacyTabRawLocator = {
    text: 'Security & privacy',
    tag: 'div',
  };

  await driver.waitForSelector(securityAndPrivacyTabRawLocator);
  await driver.clickElement(securityAndPrivacyTabRawLocator);

  const useSafeChainsListValidationLabelSelector =
    '[data-testid="useSafeChainsListValidation"]';
  const useSafeChainsListValidationToggleSelector =
    '[data-testid="useSafeChainsListValidation"] .toggle-button > div';

  let useSafeChainsListValidationLabelElement = await driver.waitForSelector(
    useSafeChainsListValidationLabelSelector,
  );

  let useSafeChainsListValidationToggleState =
    await useSafeChainsListValidationLabelElement.getText();

  assert.equal(
    useSafeChainsListValidationToggleState,
    'ON',
    'Safe chains list validation toggle is OFF by default',
  );

  await driver.clickElement(useSafeChainsListValidationToggleSelector);

  await driver.delay(regularDelayMs);

  useSafeChainsListValidationLabelElement = await driver.waitForSelector(
    useSafeChainsListValidationLabelSelector,
  );

  useSafeChainsListValidationToggleState =
    await useSafeChainsListValidationLabelElement.getText();

  assert.equal(
    useSafeChainsListValidationToggleState,
    'OFF',
    'Safe chains list validation toggle is ON',
  );

  driver.delay(regularDelayMs);

  // return to the home screen
  const appHeaderSelector = '[data-testid="app-header-logo"]';
  await driver.waitForSelector(appHeaderSelector);
  await driver.clickElement(appHeaderSelector);
}

async function candidateNetworkIsNotValidated(driver) {
  const networkMenuSelector = '[data-testid="network-display"]';
  await driver.waitForSelector(networkMenuSelector);
  await driver.clickElement(networkMenuSelector);

  await driver.clickElement({ text: 'Add a custom network', tag: 'button' });

  const [
    // first element is the search input that we don't need to fill
    networkNameInputEl,
    ,
    chainIDInputEl,
  ] = await driver.findElements('input');

  await networkNameInputEl.fill('cheapETH');
  await chainIDInputEl.fill(TEST_CHAIN_ID);
  await driver.fill('[data-testid="network-form-ticker-input"]', 'cTH');

  // Add rpc URL
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
  await rpcUrlInput.sendKeys('https://responsive-rpc.test');

  const rpcNameInput = await driver.waitForSelector(
    '[data-testid="rpc-name-input-test"]',
  );
  await rpcNameInput.sendKeys('testName');

  await driver.clickElement({
    text: 'Add URL',
    tag: 'button',
  });

  // Add explorer URL
  const explorerUrlInputDropDown = await driver.waitForSelector(
    '[data-testid="test-explorer-drop-down"]',
  );

  await driver.scrollToElement(explorerUrlInputDropDown);
  await explorerUrlInputDropDown.click();
  await driver.delay(tinyDelayMs);

  await driver.clickElement({
    text: 'Add a block explorer URL',
    tag: 'button',
  });

  const blockExplorerInput = await driver.waitForSelector(
    '[data-testid="explorer-url-input"]',
  );
  blockExplorerInput.clear();
  await blockExplorerInput.sendKeys('https://block-explorer.url');

  await driver.clickElement({
    text: 'Add URL',
    tag: 'button',
  });

  // fix flaky test
  await driver.delay(regularDelayMs);
  const saveButtonRawLocator = {
    text: 'Save',
    tag: 'button',
  };
  const saveButtonEl = await driver.findElement(saveButtonRawLocator);
  assert.equal(await saveButtonEl.isEnabled(), true);
}
