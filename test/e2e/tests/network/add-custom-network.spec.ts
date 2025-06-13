import assert from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { toHex } from '@metamask/controller-utils';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import AddEditNetworkModal from '../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../page-objects/pages/dialog/add-network-rpc-url';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

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
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.clickSwitchNetworkDropDown();

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();

        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.check_pageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField('Gnosis');
        await addEditNetworkModal.fillNetworkChainIdInputField(
          toHex(100).toString(),
        );
        await addEditNetworkModal.fillCurrencySymbolInputField('XDAI');
        await addEditNetworkModal.openAddRpcUrlModal();

        // Add rpc url and explorer url
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.check_pageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput('https://responsive-rpc.test');
        await addRpcUrlModal.fillAddRpcNameInput('testName');
        await addRpcUrlModal.saveAddRpcUrl();
        await addEditNetworkModal.addExplorerUrl('https://test.com');
        await addEditNetworkModal.saveEditedNetwork();

        // Validate the network was added
        const homepage = new HomePage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_addNetworkMessageIsDisplayed('Gnosis');
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
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.clickSwitchNetworkDropDown();

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();

        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.check_pageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField('Ethereum mainnet');
        await addEditNetworkModal.fillNetworkChainIdInputField('1');
        await addEditNetworkModal.fillCurrencySymbolInputField('TST');
        await addEditNetworkModal.openAddRpcUrlModal();

        // Add rpc url
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.check_pageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput('https://responsive-rpc.test');
        await addRpcUrlModal.fillAddRpcNameInput('testName');
        await addRpcUrlModal.saveAddRpcUrl();

        // Check symbol warning message should be displayed
        await addEditNetworkModal.check_currencySymbolWarningIsDisplayed(
          'Suggested currency symbol:ETH',
        );
        assert.equal(
          await addEditNetworkModal.check_saveButtonIsEnabled(),
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
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.clickSwitchNetworkDropDown();

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();

        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.check_pageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField(
          'Collision network',
        );
        await addEditNetworkModal.fillNetworkChainIdInputField('78');
        await addEditNetworkModal.fillCurrencySymbolInputField('TST');
        await addEditNetworkModal.openAddRpcUrlModal();

        // Add rpc url
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.check_pageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput('https://responsive-rpc.test/');
        await addRpcUrlModal.fillAddRpcNameInput('testName');
        await addRpcUrlModal.saveAddRpcUrl();

        // Check symbol warning message should be displayed
        await addEditNetworkModal.check_currencySymbolWarningIsDisplayed(
          'Suggested currency symbol:PETH',
        );
        assert.equal(
          await addEditNetworkModal.check_saveButtonIsEnabled(),
          true,
        );
        await addEditNetworkModal.saveEditedNetwork();

        // Validate the network was added
        const homepage = new HomePage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_addNetworkMessageIsDisplayed('Collision network');
      },
    );
  });
});
