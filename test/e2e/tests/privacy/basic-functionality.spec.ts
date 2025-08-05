import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../helpers';
import { METAMASK_STALELIST_URL } from '../phishing-controller/helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';
import {
  completeImportSRPOnboardingFlow,
  importSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import { mockEmptyPrices } from '../tokens/utils/mocks';
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
    await mockServer
      .forGet('https://min-api.cryptocompare.com/data/pricemulti')
      .withQuery({ fsyms: 'ETH', tsyms: 'usd' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            fakedata: 0,
          },
        };
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
    await mockEmptyPrices(mockServer, CHAIN_IDS.MAINNET),
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
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.toggleAssetsSettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

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
        await homePage.check_pageIsLoaded();

        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await homePage.refreshErc20TokenList();

        // intended delay to allow for network requests to complete
        await driver.delay(1000);
        for (const mockedEndpoint of mockedEndpoints) {
          const requests = await mockedEndpoint.getSeenRequests();
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
