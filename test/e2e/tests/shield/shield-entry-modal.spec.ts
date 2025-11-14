import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ShieldPlanPage from '../../page-objects/pages/settings/shield/shield-plan-page';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';

async function mockSubscriptionApiCalls(
  mockServer: Mockttp,
  overrides?: {
    mockNotEligible?: boolean;
  },
) {
  const userStorageMockttpController = new UserStorageMockttpController();
  userStorageMockttpController.setupPath(
    USER_STORAGE_FEATURE_NAMES.accounts,
    mockServer,
  );
  return [
    await mockServer
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/pricing')
      .thenJson(200, {
        products: [
          {
            name: 'shield',
            prices: [
              {
                interval: 'month',
                unitAmount: 800,
                unitDecimals: 2,
                currency: 'usd',
                trialPeriodDays: 14,
                minBillingCycles: 12,
              },
              {
                interval: 'year',
                unitAmount: 8000,
                unitDecimals: 2,
                currency: 'usd',
                trialPeriodDays: 14,
                minBillingCycles: 1,
              },
            ],
          },
        ],
        paymentMethods: [
          {
            type: 'card',
          },
        ],
      }),
    await mockServer
      .forGet(
        'https://subscription.dev-api.cx.metamask.io/v1/subscriptions/eligibility',
      )
      .always()
      .thenJson(200, [
        {
          canSubscribe: !overrides?.mockNotEligible,
          canViewEntryModal: true,
          minBalanceUSD: 1000,
          product: 'shield',
          modalType: 'A',
          cohorts: [
            {
              cohort: 'wallet_home',
              eligible: true,
              eligibilityRate: 1.0,
            },
            {
              cohort: 'post_tx',
              eligible: true,
              eligibilityRate: 1.0,
            },
          ],
          assignedCohort: null,
          hasAssignedCohortExpired: null,
        },
      ]),
    await mockServer
      .forPost('https://subscription.dev-api.cx.metamask.io/v1/user-events')
      .thenJson(200, {
        status: 'success',
      }),
    await mockServer
      .forPost('https://subscription.dev-api.cx.metamask.io/v1/cohorts/assign')
      .thenJson(200, {
        cohort: 'wallet_home',
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      }),
  ];
}

describe('Shield Entry Modal', function () {
  it('should show the shield entry modal if user does not have a shield subscription and has a balance greater than the minimum fiat balance threshold', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .withTokensController({
            allTokens: {
              '0x1': {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                    symbol: 'WETH',
                    decimals: 18,
                    isERC721: false,
                    aggregators: [],
                  },
                ],
              },
            },
          })
          .withAppStateController({
            showShieldEntryModalOnce: null, // set the initial state to null so that the modal is shown
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSubscriptionApiCalls,
        ignoredConsoleErrors: [
          // Rive WASM loading fails in test environment due to XMLHttpRequest limitations
          'Could not load Rive WASM file',
          'XMLHttpRequest is not a constructor',
        ],
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);

        await homePage.checkShieldEntryModalIsDisplayed();
        await homePage.clickOnShieldEntryModalGetStarted();

        const shieldPlanPage = new ShieldPlanPage(driver);
        await shieldPlanPage.checkPageIsLoaded();
      },
    );
  });

  it('should not show the shield entry modal if user does not have a shield subscription and has a balance less than the minimum fiat balance threshold', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSubscriptionApiCalls,
      },
      async ({ driver }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');

        await homePage.checkNoShieldEntryModalIsDisplayed();
      },
    );
  });

  it('should not show the shield entry modal if external services are disabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            useExternalServices: false,
          })
          .withAppStateController({
            showShieldEntryModalOnce: null,
          })
          .build(),
        manifestFlags: {
          useExternalServices: false,
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockSubscriptionApiCalls,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('25');

        await homePage.checkNoShieldEntryModalIsDisplayed();
      },
    );
  });

  it('should not show the shield entry modal if eligibility request returns false', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .withTokensController({
            allTokens: {
              '0x1': {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                    symbol: 'WETH',
                    decimals: 18,
                    isERC721: false,
                    aggregators: [],
                  },
                ],
              },
            },
          })
          .withAppStateController({
            showShieldEntryModalOnce: null, // set the initial state to null so that the modal is shown
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) =>
          mockSubscriptionApiCalls(server, { mockNotEligible: true }),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('25');

        await homePage.checkNoShieldEntryModalIsDisplayed();
      },
    );
  });
});
