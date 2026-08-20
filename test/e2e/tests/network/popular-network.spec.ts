import assert from 'assert';
import { Suite } from 'mocha';
import { toHex } from '@metamask/controller-utils';
import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import AddEditBlockExplorerPage from '../../page-objects/pages/networks/add-edit-block-explorer-page';
import AddEditNetworkPage from '../../page-objects/pages/networks/add-edit-network-page';
import AddEditRpcUrlPage from '../../page-objects/pages/networks/add-edit-rpc-url-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { login } from '../../page-objects/flows/login.flow';
import { closeSettings } from '../../page-objects/flows/settings.flow';

const MOCK_CHAINLIST_RESPONSE = [
  {
    name: 'Ethereum',
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

describe('Popular Networks', function (this: Suite) {
  it('add custom network without switching the network filter', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const networkFilter = new NetworkFilter(driver);
        const originalFilterLabel = await networkFilter.getLabel();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const networksPage = new NetworksPage(driver);

        await networksPage.checkPageIsLoaded();

        await networksPage.clickAddButtonForPopularNetwork('0xa86a');
        await networksPage.checkAddNetworkMessageIsDisplayed('Avalanche');
        await networksPage.clickCloseButton();

        // verify the additional network was added without switching the home filter
        await new Homepage(driver).checkPageIsLoaded();
        await networkFilter.waitUntilLabelIs(originalFilterLabel);
      },
    );
  });

  it('disable the Arbitrum network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const homepage = new Homepage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();
        await networksPage.disableNetwork('eip155:42161');
        await networksPage.clickCloseButton();
        await headerNavbar.clickDrawerBackButton();

        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed();
        await headerNavbar.openGlobalNetworksMenu();

        // check that arbitrum is on the list of popular network
        await networksPage.checkPageIsLoaded();
        await networksPage.checkPopularNetworkIsDisplayed({
          chainId: '0xa4b1',
          networkName: 'Arbitrum',
        });
      },
    );
  });

  it("when the network details validation toggle is turned on, validate user inserted details against data from 'chainid.network'", async function () {
    async function mockRPCURLAndChainId(mockServer: MockttpServer) {
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
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await login(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();
        await networksPage.openAddCustomNetworkPage();

        const addEditNetworkPage = new AddEditNetworkPage(driver);
        await addEditNetworkPage.checkPageIsLoaded();
        await addEditNetworkPage.fillNetworkNameInputField('cheapETH');
        await addEditNetworkPage.fillNetworkChainIdInputField(
          toHex(777).toString(),
        );
        await addEditNetworkPage.fillCurrencySymbolInputField('cTH');
        await addEditNetworkPage.openAddRpcUrlPage();

        // add rpc url and explorer url
        const addEditRpcUrlPage = new AddEditRpcUrlPage(driver);
        await addEditRpcUrlPage.checkPageIsLoaded();
        await addEditRpcUrlPage.fillAddRpcUrlInput(
          'https://unresponsive-rpc.test',
        );
        await addEditRpcUrlPage.fillAddRpcNameInput('testName');
        await addEditRpcUrlPage.checkErrorMessageFailedToFetchChainIdIsDisplayed();
        await addEditRpcUrlPage.checkAddRpcUrlButtonIsEnabled(false);
      },
    );
  });

  it("when the network details validation toggle is turned off, don't validate user inserted details", async function () {
    async function mockRPCURLAndChainId(mockServer: MockttpServer) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: toHex(100),
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
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await login(driver);
        const headerNavbar = new HeaderNavbar(driver);

        // navigate to security & privacy settings and toggle off network details check
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleNetworkDetailsCheck();
        await closeSettings(driver);

        // return to the home screen
        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed();
        await headerNavbar.openGlobalNetworksMenu();

        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();
        await networksPage.openAddCustomNetworkPage();

        const addEditNetworkPage = new AddEditNetworkPage(driver);
        await addEditNetworkPage.checkPageIsLoaded();
        await addEditNetworkPage.fillNetworkNameInputField('cheapETH');
        await addEditNetworkPage.fillNetworkChainIdInputField(
          toHex(100).toString(),
        );
        await addEditNetworkPage.fillCurrencySymbolInputField('cTH');
        await addEditNetworkPage.openAddRpcUrlPage();

        // add rpc url and explorer url
        const addEditRpcUrlPage = new AddEditRpcUrlPage(driver);
        await addEditRpcUrlPage.checkPageIsLoaded();
        await addEditRpcUrlPage.fillAddRpcUrlInput(
          'https://responsive-rpc.test',
        );
        await addEditRpcUrlPage.fillAddRpcNameInput('testName');
        await addEditRpcUrlPage.saveAddRpcUrl();
        await addEditNetworkPage.openAddBlockExplorerPage();
        const addEditBlockExplorerPage = new AddEditBlockExplorerPage(driver);
        await addEditBlockExplorerPage.checkPageIsLoaded();
        await addEditBlockExplorerPage.fillUrl('https://block-explorer.url');
        await addEditBlockExplorerPage.save();

        // check the save button is enabled
        assert.equal(await addEditNetworkPage.checkSaveButtonIsEnabled(), true);
      },
    );
  });
});
