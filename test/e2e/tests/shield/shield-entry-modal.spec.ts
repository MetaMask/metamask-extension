import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ShieldPlanPage from '../../page-objects/pages/settings/shield/shield-plan-page';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import {
  SHIELD_PRICING_DATA,
  SHIELD_USER_EVENTS_RESPONSE,
} from '../../helpers/shield/constants';
import {
  createShieldFixture,
  createShieldFixtureWithOnboarding,
  createShieldFixtureWithExternalServicesDisabled,
} from '../../helpers/shield/shield-fixture';

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
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/subscriptions')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          subscriptions: [],
          trialedProducts: [],
        },
      })),
    await mockServer
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/pricing')
      .thenJson(200, SHIELD_PRICING_DATA),

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

describe('Shield Entry Modal', function () {
  it('should show the shield entry modal if user does not have a shield subscription and has a balance greater than the minimum fiat balance threshold', async function () {
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

        const shieldPlanPage = new ShieldPlanPage(driver);
        await shieldPlanPage.checkPageIsLoaded();
      },
    );
  });

  it('should not show the shield entry modal if user does not have a shield subscription and has a balance less than the minimum fiat balance threshold', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixtureWithOnboarding().build(),
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
        fixtures: createShieldFixtureWithExternalServicesDisabled().build(),
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
        fixtures: createShieldFixture().build(),
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
