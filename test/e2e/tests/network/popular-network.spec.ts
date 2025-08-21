import assert from 'assert';
import { Suite } from 'mocha';
import { toHex } from '@metamask/controller-utils';
import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AddEditNetworkModal from '../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../page-objects/pages/dialog/add-network-rpc-url';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import NetworkSwitchModalConfirmation from '../../page-objects/pages/dialog/network-switch-modal-confirmation';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../page-objects/flows/network.flow';

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

describe('Popular Networks', function (this: Suite) {
  it('add custom network and switch the network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.clickAddButtonForPopularNetwork('0xa4b1');

        const networkSwitchModalConfirmation =
          new NetworkSwitchModalConfirmation(driver);
        await networkSwitchModalConfirmation.checkPageIsLoaded();
        await networkSwitchModalConfirmation.checkNetworkInformationIsDisplayed(
          {
            networkURL: 'https://arbitrum-mainnet.infura.io',
            currencySymbol: 'ETH',
            chainId: '42161',
            networkName: 'Arbitrum One',
            blockExplorerURL: 'https://explorer.arbitrum.io',
          },
        );
        await networkSwitchModalConfirmation.clickApproveButton();

        // verify network is switched
        await new Homepage(driver).checkPageIsLoaded();
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
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homepage = new Homepage(driver);
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.deleteNetwork('eip155:42161');

        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed();
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        // check that arbitrum is on the list of popular network
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.checkPopularNetworkIsDisplayed({
          chainId: '0xa4b1',
          networkName: 'Arbitrum One',
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
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();

        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField('cheapETH');
        await addEditNetworkModal.fillNetworkChainIdInputField(
          toHex(777).toString(),
        );
        await addEditNetworkModal.fillCurrencySymbolInputField('cTH');
        await addEditNetworkModal.openAddRpcUrlModal();

        // add rpc url and explorer url
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.checkPageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput(
          'https://unresponsive-rpc.test',
        );
        await addRpcUrlModal.fillAddRpcNameInput('testName');
        await addRpcUrlModal.saveAddRpcUrl();

        // check the error message is displayed
        await addEditNetworkModal.checkChainIdInputErrorMessageIsDisplayed(
          'Could not fetch chain ID. Is your RPC URL correct?',
        );
        assert.equal(
          await addEditNetworkModal.checkSaveButtonIsEnabled(),
          false,
        );
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
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // navigate to security & privacy settings and toggle off network details check
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleNetworkDetailsCheck();
        await settingsPage.closeSettingsPage();

        // return to the home screen
        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed();
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();

        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField('cheapETH');
        await addEditNetworkModal.fillNetworkChainIdInputField(
          toHex(100).toString(),
        );
        await addEditNetworkModal.fillCurrencySymbolInputField('cTH');
        await addEditNetworkModal.openAddRpcUrlModal();

        // add rpc url and explorer url
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.checkPageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput('https://responsive-rpc.test');
        await addRpcUrlModal.fillAddRpcNameInput('testName');
        await addRpcUrlModal.saveAddRpcUrl();
        await addEditNetworkModal.addExplorerUrl('https://block-explorer.url');

        // check the save button is enabled
        assert.equal(
          await addEditNetworkModal.checkSaveButtonIsEnabled(),
          true,
        );
      },
    );
  });
});
