import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../helpers';
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
import { createShieldFixture } from '../../helpers/shield/shield-fixture';

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
  await shieldDetailPage.waitForPageToLoad();

  // Verify customer ID matches mock response
  const customerId = await shieldDetailPage.getCustomerId();
  console.log('Customer ID:', customerId);
  assert(
    customerId.includes('test_customer_id'),
    `Expected customer ID to contain 'test_customer_id', but got: ${customerId}`,
  );

  // Verify trial badge is displayed (status is 'trialing' in mock)
  await shieldDetailPage.checkTrialTagDisplayed();

  // Verify membership status
  const membershipStatus = await shieldDetailPage.getMembershipStatus();
  assert(
    membershipStatus.includes('Active membership'),
    `Expected membership status to indicate Active membership, but got: ${membershipStatus}`,
  );

  // Verify next billing date (should be 2025-11-03 based on mock)
  const nextBillingDate = await shieldDetailPage.getNextBillingDate();
  assert(
    nextBillingDate.includes('Nov 3'),
    `Expected next billing date to contain '2025-11-03' or 'Nov 3', but got: ${nextBillingDate}`,
  );

  // Verify charges (should be $80.00 based on mock unitAmount: 8000, unitDecimals: 2)
  const charges = await shieldDetailPage.getCharges();
  assert(
    charges.includes('$80'),
    `Expected charges to contain '$80', but got: ${charges}`,
  );

  // Verify payment method (should show Visa ending in 4242 based on mock)
  const paymentMethod = await shieldDetailPage.getPaymentMethod();
  assert(
    paymentMethod.includes('Visa') && paymentMethod.includes('4242'),
    `Expected payment method to contain 'visa' and '4242', but got: ${paymentMethod}`,
  );

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

  // Switch to the checkout tab and simulate successful payment completion
  const windowHandles = await driver.getAllWindowHandles();

  await driver.delay(2000);
  await driver.closeWindowHandle(windowHandles[1]);
  await driver.waitUntilXWindowHandles(1);

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
