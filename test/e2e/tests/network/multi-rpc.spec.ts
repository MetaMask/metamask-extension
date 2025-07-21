import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { Mockttp } from '../../mock-e2e';
import {
  expectMockRequest,
  expectNoMockRequest,
} from '../../helpers/mock-server';
import EditNetworkModal from '../../page-objects/pages/dialog/edit-network';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/homepage';
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

describe('MultiRpc:', function (this: Suite) {
  it('should migrate to multi rpc @no-mmi', async function () {
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
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver, ganacheServer }) => {
        await completeImportSRPOnboardingFlow({ driver });
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_localBlockchainBalanceIsDisplayed(ganacheServer);

        await new HeaderNavbar(driver).clickSwitchNetworkDropDown();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();

        // check rpc number
        await selectNetworkDialog.openNetworkRPC('0xa4b1');
        await selectNetworkDialog.check_networkRPCNumber(2);
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
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver, mockedEndpoint }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

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

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.openNetworkRPC('0xa4b1');
        await selectNetworkDialog.check_networkRPCNumber(2);

        // select second rpc for Arbitrum network in the network dialog
        await selectNetworkDialog.selectRPC('Arbitrum mainnet 2');
        await homePage.check_pageIsLoaded();
        await headerNavbar.clickSwitchNetworkDropDown();

        // check that the second rpc is selected in the network dialog
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.check_rpcIsSelected('Arbitrum mainnet 2');

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
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver, ganacheServer }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();

        // go to Edit Menu for Arbitrum network and select the second rpc
        await selectNetworkDialog.openNetworkListOptions('0xa4b1');
        await selectNetworkDialog.openEditNetworkModal();

        const editNetworkModal = new EditNetworkModal(driver);
        await editNetworkModal.check_pageIsLoaded();
        await editNetworkModal.selectRPCInEditNetworkModal(
          'Arbitrum mainnet 2',
        );

        // validate the network was successfully edited
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_editNetworkMessageIsDisplayed('Arbitrum One');
        await homePage.closeUseNetworkNotificationModal();

        // check that the second rpc is selected in the network dialog
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.check_rpcIsSelected('Arbitrum mainnet 2');
      },
    );
  });

  it('should select rpc from settings @no-mmi', async function () {
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
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver }: { driver: Driver }) => {
        await importSRPOnboardingFlow({ driver });
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();
        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );
        await onboardingPrivacySettingsPage.check_pageIsLoaded();
        await onboardingPrivacySettingsPage.navigateToGeneralSettings();

        // open edit network modal during onboarding and select the second rpc
        await onboardingPrivacySettingsPage.openEditNetworkModal(
          'Arbitrum One',
        );
        const editNetworkModal = new EditNetworkModal(driver);
        await editNetworkModal.check_pageIsLoaded();
        await editNetworkModal.selectRPCInEditNetworkModal(
          'Arbitrum mainnet 2',
        );
        await onboardingPrivacySettingsPage.navigateBackToSettingsPage();
        await onboardingPrivacySettingsPage.check_pageIsLoaded();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        // finish onboarding and check the network successfully edited message is displayed
        await onboardingCompletePage.completeOnboarding();
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_editNetworkMessageIsDisplayed('Arbitrum One');
        await homePage.closeUseNetworkNotificationModal();

        // check that the second rpc is selected in the network dialog
        await new HeaderNavbar(driver).clickSwitchNetworkDropDown();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.check_rpcIsSelected('Arbitrum mainnet 2');
      },
    );
  });
});
