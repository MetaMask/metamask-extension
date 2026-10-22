import { test as pwTest } from '@playwright/test';
import { NetworkStatus, RpcEndpointType } from '@metamask/network-controller';
import { E2E_DRIVER } from '../../constants';
import { withFixtures, isSidePanelEnabled } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Mockttp } from '../../mock-e2e';
import AddEditNetworkPage from '../../page-objects/pages/networks/add-edit-network-page';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import {
  importSRPOnboardingFlow,
  handleSidepanelPostOnboarding,
} from '../../page-objects/flows/onboarding.flow';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import { getMockAssetsPrice } from '../tokens/utils/mocks';

const MOCK_ETH_PRICE = 1700;

/**
 * Playwright migration of multi-rpc.spec.ts - 'should select rpc from settings'
 *
 * This spec exercises `importSRPOnboardingFlow` which uses `pasteIntoField`
 * internally. It validates the CDP bypass for LavaMoat scuttling on Chrome.
 */
pwTest.describe('MultiRpc - Playwright', () => {
  pwTest(
    'should select rpc from settings',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
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
          // Mock spot-prices for balance display
          await mockServer
            .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                'eip155:1/slip44:60': {
                  id: 'ethereum',
                  price: MOCK_ETH_PRICE,
                  marketCap: 382623505141,
                  pricePercentChange1d: 0,
                },
              },
            })),
        ];
      }

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withNetworkController({
              networkConfigurationsByChainId: {
                '0x539': {
                  blockExplorerUrls: ['https://etherscan.io/'],
                  chainId: '0x539',
                  defaultBlockExplorerUrlIndex: 0,
                  defaultRpcEndpointIndex: 0,
                  name: 'Localhost 8545',
                  nativeCurrency: 'ETH',
                  rpcEndpoints: [
                    {
                      networkClientId: 'networkConfigurationId',
                      type: RpcEndpointType.Custom,
                      url: 'http://localhost:8545',
                    },
                  ],
                },
                '0xa4b1': {
                  blockExplorerUrls: ['https://explorer.arbitrum.io'],
                  chainId: '0xa4b1',
                  defaultBlockExplorerUrlIndex: 0,
                  defaultRpcEndpointIndex: 0,
                  name: 'Arbitrum',
                  nativeCurrency: 'ETH',
                  rpcEndpoints: [
                    {
                      networkClientId: '2ce66016-8aab-47df-b27f-318c80865eb0',
                      type: RpcEndpointType.Custom,
                      url: 'https://arbitrum-mainnet.infura.io/',
                    },
                    {
                      name: 'Arbitrum mainnet 2',
                      networkClientId: '2ce66016-8aab-47df-b27f-318c80865eb1',
                      type: RpcEndpointType.Custom,
                      url: 'https://responsive-rpc.test/',
                    },
                  ],
                },
              },
              networksMetadata: {
                networkConfigurationId: {
                  EIPS: { 1559: true },
                  status: NetworkStatus.Available,
                },
                '2ce66016-8aab-47df-b27f-318c80865eb0': {
                  EIPS: { 1559: true },
                  status: NetworkStatus.Available,
                },
                '2ce66016-8aab-47df-b27f-318c80865eb1': {
                  EIPS: { 1559: true },
                  status: NetworkStatus.Available,
                },
              },
              selectedNetworkClientId: 'networkConfigurationId',
            })
            .withAssetsController({
              assetsPrice: getMockAssetsPrice(MOCK_ETH_PRICE),
            })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          testSpecificMock: mockRPCURLAndChainId,
        },
        async ({ driver }) => {
          // This flow uses pasteIntoField for SRP entry, which requires CDP
          // bypass on Chrome extension pages to avoid LavaMoat scuttling errors
          await importSRPOnboardingFlow({ driver });

          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
          await onboardingCompletePage.navigateToDefaultPrivacySettings();

          const onboardingPrivacySettingsPage =
            new OnboardingPrivacySettingsPage(driver);
          await onboardingPrivacySettingsPage.checkPageIsLoaded();
          await onboardingPrivacySettingsPage.navigateToNetworksSettings();

          // open edit network modal during onboarding and select the second rpc
          await onboardingPrivacySettingsPage.openEditNetworkModal('Arbitrum');
          const editNetworkPage = new AddEditNetworkPage(driver);
          await editNetworkPage.checkPageIsLoaded();
          await editNetworkPage.selectRpcUrlAndSave('Arbitrum mainnet 2');
          await onboardingPrivacySettingsPage.navigateBackToSettingsPage();
          await onboardingPrivacySettingsPage.checkPageIsLoaded();
          await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

          // finish onboarding and check the network successfully edited message is displayed
          await onboardingCompletePage.completeOnboarding();

          // Handle sidepanel navigation if needed
          await handleSidepanelPostOnboarding(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();

          // Check for edit network toast (may not appear with sidepanel due to appState loss)
          if (await isSidePanelEnabled()) {
            console.log(
              'Skipping edit network toast check for sidepanel build',
            );
          } else {
            await homePage.checkEditNetworkMessageIsDisplayed('Arbitrum');
          }
          await homePage.closeUseNetworkNotificationModal();

          // check that the second rpc is selected in the network dialog
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openGlobalNetworksMenu();
          const networksPage = new NetworksPage(driver);
          await networksPage.checkPageIsLoaded();
          await networksPage.checkRpcIsSelected('Arbitrum mainnet 2');
        },
      );
    },
  );
});
