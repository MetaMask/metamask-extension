import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ShieldPlanPage from '../../page-objects/pages/settings/shield/shield-plan-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import ShieldDetailPage from '../../page-objects/pages/settings/shield/shield-detail-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import {
  BASE_SHIELD_SUBSCRIPTION,
  MOCK_CHECKOUT_SESSION_URL,
  SHIELD_PRICING_DATA,
  SHIELD_USER_EVENTS_RESPONSE,
} from '../../helpers/shield/constants';
import { Driver } from '../../webdriver/driver';

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
    await mockServer
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/subscriptions')
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

    await mockServer
      .forGet(
        'https://subscription.dev-api.cx.metamask.io/v1/subscriptions/eligibility',
      )
      .thenJson(200, [
        {
          canSubscribe: !overrides?.mockNotEligible,
          canViewEntryModal: true,
          minBalanceUSD: 1000,
          product: 'shield',
        },
      ]),
    await mockServer
      .forPost('https://subscription.dev-api.cx.metamask.io/v1/user-events')
      .thenJson(200, SHIELD_USER_EVENTS_RESPONSE),
  ];
}

async function validateShieldDetailPage(driver: Driver) {
  const shieldDetailPage = new ShieldDetailPage(driver);
  await shieldDetailPage.checkPageIsLoaded();

  // Verify customer ID matches mock response
  await shieldDetailPage.checkCustomerId('test_customer_id');

  // Verify trial badge is displayed (status is 'trialing' in mock)
  await shieldDetailPage.checkTrialTagDisplayed();

  // Verify membership status
  await shieldDetailPage.checkMembershipStatus('Active membership');

  // Verify next billing date (should be 2025-11-03 based on mock)
  await shieldDetailPage.checkNextBillingDate('Nov 3');

  // Verify charges (should be $80.00 based on mock unitAmount: 8000, unitDecimals: 2)
  await shieldDetailPage.checkCharges('$80');

  // Verify payment method (should show Visa ending in 4242 based on mock)
  await shieldDetailPage.checkPaymentMethod('Visa');

  console.log('All Shield Detail page assertions passed successfully');
}

async function completeShieldPlanSubscriptionFlow(
  driver: Driver,
  plan: 'annual' | 'monthly',
) {
  const shieldPlanPage = new ShieldPlanPage(driver);
  await shieldPlanPage.checkPageIsLoaded();

  if (plan === 'annual') {
    await shieldPlanPage.selectAnnualPlan();
  } else {
    await shieldPlanPage.selectMonthlyPlan();
  }

  await shieldPlanPage.clickContinueButton();

  // Wait for checkout tab to open and switch to it
  await driver.waitUntilXWindowHandles(2);

  // Switch back to the main MetaMask window
  await driver.switchToWindowWithTitle('MetaMask');
}

describe('Shield Subscription Tests', function () {
  describe('Shield Entry Modal', function () {
    it('should subscribe to the shield plan from the entry modal - annual plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockSubscriptionApiCalls,
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);

          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          await completeShieldPlanSubscriptionFlow(driver, 'annual');

          await validateShieldDetailPage(driver);
        },
      );
    });

    it('should subscribe to the shield plan from the entry modal - monthly plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockSubscriptionApiCalls,
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);

          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          await completeShieldPlanSubscriptionFlow(driver, 'monthly');

          await validateShieldDetailPage(driver);
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
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalSkip();

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          await completeShieldPlanSubscriptionFlow(driver, 'annual');

          await validateShieldDetailPage(driver);
        },
      );
    });

    it('should subscribe to the shield plan from the settings > shield - monthly plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockSubscriptionApiCalls,
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalSkip();

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          await completeShieldPlanSubscriptionFlow(driver, 'monthly');

          await validateShieldDetailPage(driver);
        },
      );
    });
  });
});
