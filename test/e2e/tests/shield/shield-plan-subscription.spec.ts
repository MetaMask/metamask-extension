import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ShieldPlanPage from '../../page-objects/pages/settings/shield/shield-plan-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import ShieldDetailPage from '../../page-objects/pages/settings/shield/shield-detail-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import {
  BASE_SHIELD_SUBSCRIPTION,
  MOCK_CHECKOUT_SESSION_URL,
  SHIELD_PRICING_DATA,
  SHIELD_USER_EVENTS_RESPONSE,
} from '../../helpers/shield/constants';

// Local fixture for this spec file
function createShieldFixture() {
  return new FixtureBuilder()
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
    });
}

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

  // Shared state to track if card subscription was requested
  let cardSubscriptionRequested = false;

  return [
    // GET subscriptions - returns data only if card subscription was requested
    // Using .always() to ensure this overrides global mocks
    await mockServer
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/subscriptions')
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: cardSubscriptionRequested
          ? {
              customerId: 'test_customer_id',
              subscriptions: [BASE_SHIELD_SUBSCRIPTION],
              trialedProducts: ['shield'],
            }
          : {
              subscriptions: [],
              trialedProducts: [],
            },
      })),
    await mockServer
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/pricing')
      .thenJson(200, SHIELD_PRICING_DATA),

    // Mock card subscription creation endpoint
    await mockServer
      .forPost(
        'https://subscription.dev-api.cx.metamask.io/v1/subscriptions/card',
      )
      .thenCallback(() => {
        cardSubscriptionRequested = true;
        return {
          statusCode: 200,
          json: {
            checkoutSessionUrl: MOCK_CHECKOUT_SESSION_URL,
          },
        };
      }),

    // Mock checkout session URL to redirect to success URL
    await mockServer.forGet(MOCK_CHECKOUT_SESSION_URL).thenCallback(() => ({
      statusCode: 302,
      headers: { Location: 'https://mock-redirect-url.com' },
    })),

    // Using .always() to ensure this overrides global mocks
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
      .thenJson(200, SHIELD_USER_EVENTS_RESPONSE),

    // Mock cohort assignment endpoint - required for entry modal to show
    await mockServer
      .forPost('https://subscription.dev-api.cx.metamask.io/v1/cohorts/assign')
      .thenJson(200, {
        cohort: 'wallet_home',
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      }),
  ];
}

describe('Shield Subscription Tests', function () {
  describe('Shield Entry Modal', function () {
    it('should subscribe to the shield plan from the entry modal - annual plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
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
          await shieldPlanPage.completeShieldPlanSubscriptionFlow('annual');

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.validateShieldDetailPage();
        },
      );
    });

    it('should subscribe to the shield plan from the entry modal - monthly plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
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
          await shieldPlanPage.completeShieldPlanSubscriptionFlow('monthly');

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.validateShieldDetailPage();
        },
      );
    });
  });

  describe('Shield Settings Subscription', function () {
    it('should subscribe to the shield plan from the settings > shield - annual plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
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
          await shieldPlanPage.clickBackButton();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          await shieldPlanPage.completeShieldPlanSubscriptionFlow('annual');

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.validateShieldDetailPage();
        },
      );
    });

    it('should subscribe to the shield plan from the settings > shield - monthly plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
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
          await shieldPlanPage.clickBackButton();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          await homePage.clickOnShieldEntryModalGetStarted();
          await shieldPlanPage.completeShieldPlanSubscriptionFlow('monthly');

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.validateShieldDetailPage();
        },
      );
    });
  });
});
