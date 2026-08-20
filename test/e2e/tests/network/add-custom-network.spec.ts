import assert from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { toHex } from '@metamask/controller-utils';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import AddEditBlockExplorerPage from '../../page-objects/pages/networks/add-edit-block-explorer-page';
import AddEditNetworkPage from '../../page-objects/pages/networks/add-edit-network-page';
import AddEditRpcUrlPage from '../../page-objects/pages/networks/add-edit-rpc-url-page';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import { login } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

describe('Add Custom network', function (this: Suite) {
  it('should add mainnet network', async function () {
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
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
        const networkFilter = new NetworkFilter(driver);
        const originalFilterLabel = await networkFilter.getLabel();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();
        await networksPage.openAddCustomNetworkPage();

        const addEditNetworkPage = new AddEditNetworkPage(driver);
        await addEditNetworkPage.checkPageIsLoaded();
        await addEditNetworkPage.fillNetworkNameInputField('Gnosis');
        await addEditNetworkPage.fillNetworkChainIdInputField(
          toHex(100).toString(),
        );
        await addEditNetworkPage.fillCurrencySymbolInputField('XDAI');
        await addEditNetworkPage.openAddRpcUrlPage();

        // Add rpc url and explorer url
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
        await addEditBlockExplorerPage.fillUrl('https://test.com');
        await addEditBlockExplorerPage.save();
        await addEditNetworkPage.saveEditedNetwork();
        await networksPage.checkAddNetworkMessageIsDisplayed('Gnosis');
        await networksPage.clickCloseButton();

        // Validate the network was added
        const homepage = new HomePage(driver);
        await homepage.checkPageIsLoaded();
        await networkFilter.waitUntilLabelIs(originalFilterLabel);
      },
    );
  });

  it('should check symbol and show warnings', async function () {
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
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
        const networkFilter = new NetworkFilter(driver);
        const originalFilterLabel = await networkFilter.getLabel();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();
        await networksPage.openAddCustomNetworkPage();

        const addEditNetworkPage = new AddEditNetworkPage(driver);
        await addEditNetworkPage.checkPageIsLoaded();
        await addEditNetworkPage.fillNetworkNameInputField('Ethereum mainnet');
        await addEditNetworkPage.fillNetworkChainIdInputField('1');
        await addEditNetworkPage.fillCurrencySymbolInputField('TST');
        await addEditNetworkPage.openAddRpcUrlPage();

        // Add rpc url
        const addEditRpcUrlPage = new AddEditRpcUrlPage(driver);
        await addEditRpcUrlPage.checkPageIsLoaded();
        await addEditRpcUrlPage.fillAddRpcUrlInput(
          'https://responsive-rpc.test',
        );
        await addEditRpcUrlPage.fillAddRpcNameInput('testName');
        await addEditRpcUrlPage.saveAddRpcUrl();

        // Check symbol warning message should be displayed
        await addEditNetworkPage.checkCurrencySymbolWarningIsDisplayed(
          'Suggested currency symbol:ETH',
        );
        assert.equal(
          await addEditNetworkPage.checkSaveButtonIsEnabled(),
          false,
        );
      },
    );
  });

  it('should add collision network', async function () {
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: toHex(78),
            },
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
        await addEditNetworkPage.fillNetworkNameInputField('Collision network');
        await addEditNetworkPage.fillNetworkChainIdInputField('78');
        await addEditNetworkPage.fillCurrencySymbolInputField('TST');
        await addEditNetworkPage.openAddRpcUrlPage();

        // Add rpc url
        const addEditRpcUrlPage = new AddEditRpcUrlPage(driver);
        await addEditRpcUrlPage.checkPageIsLoaded();
        await addEditRpcUrlPage.fillAddRpcUrlInput(
          'https://responsive-rpc.test/',
        );
        await addEditRpcUrlPage.fillAddRpcNameInput('testName');
        await addEditRpcUrlPage.saveAddRpcUrl();

        // Check symbol warning message should be displayed
        await addEditNetworkPage.checkCurrencySymbolWarningIsDisplayed(
          'Suggested currency symbol:PETH',
        );
        assert.equal(await addEditNetworkPage.checkSaveButtonIsEnabled(), true);
        await addEditNetworkPage.saveEditedNetwork();
        await networksPage.checkAddNetworkMessageIsDisplayed(
          'Collision network',
        );
        await networksPage.clickCloseButton();

        // Validate the network was added
        const homepage = new HomePage(driver);
        await homepage.checkPageIsLoaded();
      },
    );
  });
});
