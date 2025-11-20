import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import {
  BASE_SHIELD_SUBSCRIPTION_CRYPTO,
  SHIELD_PRICING_DATA,
  SHIELD_USER_EVENTS_RESPONSE,
} from '../../helpers/shield/constants';
import ShieldPlanPage from '../../page-objects/pages/settings/shield/shield-plan-page';
import ShieldSubscriptionApprovePage from '../../page-objects/pages/settings/shield/shield-subscription-approve-page';
import ShieldDetailPage from '../../page-objects/pages/settings/shield/shield-detail-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';

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
          // USDC and USDT tokens on Mainnet
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              decimals: 6,
              isERC721: false,
              aggregators: [],
            },
            {
              address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
              symbol: 'USDT',
              decimals: 6,
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

  // Shared state to track if crypto subscription was requested
  let cryptoSubscriptionRequested = false;

  return [
    // GET subscriptions - returns data only if crypto subscription was requested
    // Using .always() to ensure this overrides global mocks
    await mockServer
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/subscriptions')
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: cryptoSubscriptionRequested
          ? {
              customerId: 'test_customer_id',
              subscriptions: [BASE_SHIELD_SUBSCRIPTION_CRYPTO],
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

    await mockServer
      .forPost(
        'https://subscription.dev-api.cx.metamask.io/v1/subscriptions/crypto/approval-amount',
      )
      .always()
      .thenJson(200, {
        approveAmount: '100000000', // 100 USDC/USDT with 6 decimals (100 * 10^6)
        paymentAddress: '0x1234567890123456789012345678901234567890',
        paymentTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC or USDT
      }),

    // Mock crypto subscription creation endpoint
    await mockServer
      .forPost(
        'https://subscription.dev-api.cx.metamask.io/v1/subscriptions/crypto',
      )
      .thenCallback(() => {
        cryptoSubscriptionRequested = true;
        return {
          statusCode: 200,
          json: [BASE_SHIELD_SUBSCRIPTION_CRYPTO],
        };
      }),
  ];
}

describe('Shield Subscription Crypto Payment Tests', function () {
  describe('Shield Entry Modal', function () {
    it('should get started on entry modal - annual plan', async function () {
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
          localNodeOptions: [
            {
              type: 'anvil',
              options: {
                chainId: 1,
                loadState:
                  './test/e2e/seeder/network-states/with100Usdc100Usdt.json',
              },
            },
          ],
        },
        async ({ driver, localNodes }) => {
          await loginWithBalanceValidation(driver, localNodes[0]);

          const homePage = new HomePage(driver);

          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          const shieldPlanPage = new ShieldPlanPage(driver);
          await shieldPlanPage.checkPageIsLoaded();

          await shieldPlanPage.completeShieldPlanSubscriptionFlowWithCrypto(
            'annual',
          );

          const shieldSubscriptionApprovePage =
            new ShieldSubscriptionApprovePage(driver);
          await shieldSubscriptionApprovePage.checkPageIsLoaded();
          await shieldSubscriptionApprovePage.clickStartNowButton();

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.checkPageIsLoaded();
          await shieldDetailPage.validateShieldDetailPage({
            charges: '80 USDC (Annual)',
            nextBillingDate: 'Nov 3, 2025',
            paymentMethod: 'USDC',
          });
        },
      );
    });
  });

  describe('Shield Settings Subscription', function () {
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
          localNodeOptions: [
            {
              type: 'anvil',
              options: {
                chainId: 1,
                loadState:
                  './test/e2e/seeder/network-states/with100Usdc100Usdt.json',
              },
            },
          ],
        },
        async ({ driver, localNodes }) => {
          await loginWithBalanceValidation(driver, localNodes[0]);

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
          await shieldPlanPage.completeShieldPlanSubscriptionFlowWithCrypto(
            'monthly',
          );

          const shieldSubscriptionApprovePage =
            new ShieldSubscriptionApprovePage(driver);
          await shieldSubscriptionApprovePage.checkPageIsLoaded();
          await shieldSubscriptionApprovePage.clickStartNowButton();

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.checkPageIsLoaded();
          await shieldDetailPage.validateShieldDetailPage({
            charges: '80 USDC (Annual)',
            nextBillingDate: 'Nov 3, 2025',
            paymentMethod: 'USDC',
          });
        },
      );
    });
  });
});
