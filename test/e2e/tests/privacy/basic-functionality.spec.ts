import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures, isSidePanelEnabled } from '../../helpers';
import { METAMASK_STALELIST_URL } from '../phishing-controller/helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';
import {
  completeImportSRPOnboardingFlow,
  importSRPOnboardingFlow,
  handleSidepanelPostOnboarding,
} from '../../page-objects/flows/onboarding.flow';
import { mockEmptyPrices, mockSpotPrices } from '../tokens/utils/mocks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  UserStorageMockttpController,
  UserStorageResponseData,
} from '../../helpers/identity/user-storage/userStorageMockttpController';
import {
  accountsToMockForAccountsSync,
  getAccountsSyncMockResponse,
} from '../identity/account-syncing/mock-data';
import { mockIdentityServices } from '../identity/mocks';

async function mockApis(
  mockServer: Mockttp,
  userStorageMockttpController: UserStorageMockttpController,
  mockedAccountSyncResponse: UserStorageResponseData[],
) {
  userStorageMockttpController.setupPath(
    USER_STORAGE_FEATURE_NAMES.accounts,
    mockServer,
    {
      getResponse: mockedAccountSyncResponse,
    },
  );
  await mockIdentityServices(mockServer, userStorageMockttpController);

  // Mock feature flags API to prevent Redux initialization issues
  await mockServer
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .thenCallback(() => ({
      statusCode: 200,
      json: [{}],
    }));

  // Mock Infura RPC endpoints for mainnet
  const infuraPattern = /mainnet\.infura\.io/u;
  await mockServer
    .forPost(infuraPattern)
    .withJsonBodyIncluding({ method: 'eth_blockNumber' })
    .thenCallback(() => ({
      statusCode: 200,
      json: { jsonrpc: '2.0', id: 1, result: '0x1234567' },
    }));

  await mockServer
    .forPost(infuraPattern)
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback(() => ({
      statusCode: 200,
      json: { jsonrpc: '2.0', id: 1, result: '0x15af1d78b58c40000' }, // 25 ETH
    }));

  await mockServer
    .forPost(infuraPattern)
    .withJsonBodyIncluding({ method: 'eth_chainId' })
    .thenCallback(() => ({
      statusCode: 200,
      json: { jsonrpc: '2.0', id: 1, result: '0x1' },
    }));

  await mockServer
    .forPost(infuraPattern)
    .withJsonBodyIncluding({ method: 'net_version' })
    .thenCallback(() => ({
      statusCode: 200,
      json: { jsonrpc: '2.0', id: 1, result: '1' },
    }));

  await mockServer
    .forPost(infuraPattern)
    .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: 1,
        result: {
          number: '0x1234567',
          hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          timestamp: '0x64',
          baseFeePerGas: '0x7',
        },
      },
    }));

  // Mock gas API
  await mockServer
    .forGet('https://gas.api.cx.metamask.io/v1/supportedNetworks')
    .thenCallback(() => ({
      statusCode: 200,
      json: ['0x1'],
    }));

  return [
    await mockServer.forGet(METAMASK_STALELIST_URL).thenCallback(() => {
      return {
        statusCode: 200,
        json: [{ fakedata: true }],
      };
    }),
    await mockServer
      .forGet('https://token.api.cx.metamask.io/tokens/1')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [{ fakedata: true }],
        };
      }),
    await mockSpotPrices(mockServer, {
      'eip155:1/slip44:60': {
        price: 1700,
        marketCap: 382623505141,
        pricePercentChange1d: 0,
      },
    }),
    await mockServer
      .forGet(
        'https://nft.api.cx.metamask.io/users/0x5cfe73b6021e818b776b421b1c4db2474086a7e1/tokens',
      )
      .withQuery({
        limit: 50,
        includeTopBid: 'true',
        chainIds: ['1', '59144'],
        continuation: '',
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            tokens: [],
          },
        };
      }),
    await mockEmptyPrices(mockServer),
  ];
}

describe('MetaMask onboarding', function () {
  const arrange = async () => {
    const unencryptedAccounts = accountsToMockForAccountsSync;
    const mockedAccountSyncResponse = await getAccountsSyncMockResponse();
    const userStorageMockttpController = new UserStorageMockttpController();
    return {
      unencryptedAccounts,
      mockedAccountSyncResponse,
      userStorageMockttpController,
    };
  };

  it('should prevent network requests to basic functionality endpoints when the basic functionality toggle is off', async function () {
    const { mockedAccountSyncResponse, userStorageMockttpController } =
      await arrange();
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            sendRedesign: {
              enabled: false,
            },
          },
        },
        testSpecificMock: (server: Mockttp) =>
          mockApis(
            server,
            userStorageMockttpController,
            mockedAccountSyncResponse,
          ),
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await importSRPOnboardingFlow({ driver });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.toggleAssetsSettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await homePage.refreshErc20TokenList();

        for (const mockedEndpoint of mockedEndpoints) {
          const requests = await mockedEndpoint.getSeenRequests();
          assert.equal(
            requests.length,
            0,
            `${mockedEndpoint} should make requests after onboarding`,
          );
        }
      },
    );
  });

  it('should not prevent network requests to basic functionality endpoints when the basic functionality toggle is on', async function () {
    const { mockedAccountSyncResponse, userStorageMockttpController } =
      await arrange();
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
            },
          })
          .withAccountTracker({
            accountsByChainId: {
              '0x1': {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
                  balance: '0x15af1d78b58c40000', // 25 ETH
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) =>
          mockApis(
            server,
            userStorageMockttpController,
            mockedAccountSyncResponse,
          ),
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await homePage.refreshErc20TokenList();

        // Check if sidepanel is enabled
        const hasSidepanel = await isSidePanelEnabled();

        // intended delay to allow for network requests to complete
        await driver.delay(1000);
        for (const mockedEndpoint of mockedEndpoints) {
          const requests = await mockedEndpoint.getSeenRequests();

          if (hasSidepanel) {
            // Skip assertion for sidepanel builds - cannot accurately count requests
            // when sidepanel loads home.html in parallel with the main test window
            console.log(
              `Skipping request count assertion for sidepanel build - ${mockedEndpoint}`,
            );
            continue;
          }

          assert.equal(
            requests.length,
            1,
            `${mockedEndpoint} should make requests after onboarding`,
          );
        }
      },
    );
  });
});
