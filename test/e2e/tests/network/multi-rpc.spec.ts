import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { Mockttp } from '../../mock-e2e';
import {
  expectMockRequest,
  expectNoMockRequest,
} from '../../helpers/mock-server';
import AddEditNetworkModal from '../../page-objects/pages/dialog/add-edit-network';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import {
  loginWithoutBalanceValidation,
  loginWithBalanceValidation,
} from '../../page-objects/flows/login.flow';
import {
  completeImportSRPOnboardingFlow,
  importSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../page-objects/flows/network.flow';

describe('MultiRpc:', function (this: Suite) {
  it('should migrate to multi rpc', async function () {
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: '0xa4b1',
            },
          })),
      ];
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
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
              '2ce66016-8aab-47df-b27f-318c80865eb1': {
                chainId: '0xa4b1',
                id: '2ce66016-8aab-47df-b27f-318c80865eb1',
                nickname: 'Arbitrum mainnet 2',
                rpcPrefs: {},
                rpcUrl: 'https://responsive-rpc.test/',
                ticker: 'ETH',
              },
            },
            selectedNetworkClientId: 'networkConfigurationId',
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver }) => {
        await completeImportSRPOnboardingFlow({ driver });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkLocalNodeBalanceIsDisplayed();

        await switchToEditRPCViaGlobalMenuNetworks(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();

        // check rpc number
        await selectNetworkDialog.openNetworkRPC('eip155:42161');
        await selectNetworkDialog.checkNetworkRPCNumber(2);
      },
    );
  });

  it('should select rpc from modal', async function () {
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: '0xa4b1',
            },
          })),
        await mockServer
          .forPost('https://arbitrum-mainnet.infura.io/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: '0xa4b1',
            },
          })),
      ];
    }
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
              '2ce66016-8aab-47df-b27f-318c80865eb1': {
                chainId: '0xa4b1',
                id: '2ce66016-8aab-47df-b27f-318c80865eb1',
                nickname: 'Arbitrum mainnet 2',
                rpcPrefs: {},
                rpcUrl: 'https://responsive-rpc.test/',
                ticker: 'ETH',
              },
            },
            selectedNetworkClientId: '2ce66016-8aab-47df-b27f-318c80865eb0',
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver, mockedEndpoint }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const usedUrlBeforeSwitch = await mockedEndpoint[1].getSeenRequests();

        // check the url first request send on the background to the mocked rpc after switch
        assert.equal(
          usedUrlBeforeSwitch[0].url,
          'https://arbitrum-mainnet.infura.io/',
        );

        // check that requests are sent on the background for the url https://arbitrum-mainnet.infura.io/
        await expectMockRequest(driver, mockedEndpoint[1], { timeout: 3000 });

        // check that requests are sent on the background for the rpc https://responsive-rpc.test/
        await expectNoMockRequest(driver, mockedEndpoint[0], { timeout: 3000 });

        await switchToEditRPCViaGlobalMenuNetworks(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openNetworkRPC('eip155:42161');
        await selectNetworkDialog.checkNetworkRPCNumber(2);

        // select second rpc for Arbitrum network in the network dialog
        await selectNetworkDialog.selectRPC('Arbitrum mainnet 2');
        await homePage.checkPageIsLoaded();
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        // check that the second rpc is selected in the network dialog
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.checkRpcIsSelected('Arbitrum mainnet 2');

        const usedUrl = await mockedEndpoint[0].getSeenRequests();
        // check the url first request send on the background to the mocked rpc after switch
        assert.equal(usedUrl[0].url, 'https://responsive-rpc.test/');

        // check that requests are sent on the background for the url https://responsive-rpc.test/
        await expectMockRequest(driver, mockedEndpoint[0], { timeout: 3000 });
      },
    );
  });

  it('should select rpc from edit menu', async function () {
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: '0xa4b1',
            },
          })),
      ];
    }
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
              '2ce66016-8aab-47df-b27f-318c80865eb1': {
                chainId: '0xa4b1',
                id: '2ce66016-8aab-47df-b27f-318c80865eb1',
                nickname: 'Arbitrum mainnet 2',
                rpcPrefs: {},
                rpcUrl: 'https://responsive-rpc.test/',
                ticker: 'ETH',
              },
            },
            selectedNetworkClientId: 'networkConfigurationId',
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await switchToEditRPCViaGlobalMenuNetworks(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();

        // go to Edit Menu for Arbitrum network and select the second rpc
        await selectNetworkDialog.openNetworkListOptions('eip155:42161');
        await selectNetworkDialog.openEditNetworkModal();

        const editNetworkModal = new AddEditNetworkModal(driver);
        await editNetworkModal.checkPageIsLoaded();
        await editNetworkModal.selectRPCInEditNetworkModal(
          'Arbitrum mainnet 2',
        );

        // validate the network was successfully edited
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkEditNetworkMessageIsDisplayed('Arbitrum');
        await homePage.closeUseNetworkNotificationModal();

        // check that the second rpc is selected in the network dialog
        await switchToEditRPCViaGlobalMenuNetworks(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.checkRpcIsSelected('Arbitrum mainnet 2');
      },
    );
  });

  it('should select rpc from settings', async function () {
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: '0xa4b1',
            },
          })),
      ];
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
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
              '2ce66016-8aab-47df-b27f-318c80865eb1': {
                chainId: '0xa4b1',
                id: '2ce66016-8aab-47df-b27f-318c80865eb1',
                nickname: 'Arbitrum mainnet 2',
                rpcPrefs: {},
                rpcUrl: 'https://responsive-rpc.test/',
                ticker: 'ETH',
              },
            },
            selectedNetworkClientId: 'networkConfigurationId',
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver }: { driver: Driver }) => {
        await importSRPOnboardingFlow({ driver });
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();
        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );
        await onboardingPrivacySettingsPage.checkPageIsLoaded();
        await onboardingPrivacySettingsPage.navigateToGeneralSettings();

        // open edit network modal during onboarding and select the second rpc
        await onboardingPrivacySettingsPage.openEditNetworkModal('Arbitrum');
        const editNetworkModal = new AddEditNetworkModal(driver);
        await editNetworkModal.checkPageIsLoaded();
        await editNetworkModal.selectRPCInEditNetworkModal(
          'Arbitrum mainnet 2',
        );
        await onboardingPrivacySettingsPage.navigateBackToSettingsPage();
        await onboardingPrivacySettingsPage.checkPageIsLoaded();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        // finish onboarding and check the network successfully edited message is displayed
        await onboardingCompletePage.completeOnboarding();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkEditNetworkMessageIsDisplayed('Arbitrum');
        await homePage.closeUseNetworkNotificationModal();

        // check that the second rpc is selected in the network dialog
        await switchToEditRPCViaGlobalMenuNetworks(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.checkRpcIsSelected('Arbitrum mainnet 2');
      },
    );
  });
});
