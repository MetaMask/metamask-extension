import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import ShieldDetailPage from '../../page-objects/pages/settings/shield/shield-detail-page';
import ShieldClaimPage from '../../page-objects/pages/settings/shield/shield-claim-page';
import {
  BASE_SHIELD_SUBSCRIPTION,
  MOCK_CHECKOUT_SESSION_URL,
  SHIELD_PRICING_DATA,
  SHIELD_ELIGIBILITY_DATA,
  SHIELD_USER_EVENTS_RESPONSE,
  SHIELD_CLAIMS_RESPONSE,
} from '../../helpers/shield/constants';
import {
  generateRandomEmail,
  generateRandomWalletAddress,
  generateRandomTxHash,
  generateRandomDescription,
} from '../../helpers/test-data-generators';

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

async function mockStripeSubscriptionFlow(mockServer: Mockttp) {
  const userStorageMockttpController = new UserStorageMockttpController();
  userStorageMockttpController.setupPath(
    USER_STORAGE_FEATURE_NAMES.accounts,
    mockServer,
  );

  // Shared state across requests
  let cancelAtPeriodEnd = false;

  return [
    // GET subscriptions reflects current cancelAtPeriodEnd flag
    // Using .always() to ensure this overrides global mocks
    await mockServer
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/subscriptions')
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          customerId: 'test_customer_id',
          subscriptions: [{ ...BASE_SHIELD_SUBSCRIPTION, cancelAtPeriodEnd }],
          trialedProducts: ['shield'],
        },
      })),

    // Mock pricing information
    await mockServer
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/pricing')
      .thenJson(200, SHIELD_PRICING_DATA),

    // Mock eligibility check
    // Using .always() to ensure this overrides global mocks
    await mockServer
      .forGet(
        'https://subscription.dev-api.cx.metamask.io/v1/subscriptions/eligibility',
      )
      .always()
      .thenJson(200, SHIELD_ELIGIBILITY_DATA),

    // Mock user events
    await mockServer
      .forPost('https://subscription.dev-api.cx.metamask.io/v1/user-events')
      .thenJson(200, SHIELD_USER_EVENTS_RESPONSE),

    // Mock card subscription creation endpoint
    await mockServer
      .forPost(
        'https://subscription.dev-api.cx.metamask.io/v1/subscriptions/card',
      )
      .thenJson(200, {
        checkoutSessionUrl: MOCK_CHECKOUT_SESSION_URL,
      }),

    // Mock claims submission endpoint
    await mockServer
      .forPost('https://claims.dev-api.cx.metamask.io/claims')
      .thenJson(200, SHIELD_CLAIMS_RESPONSE),

    // Mock cancel subscription endpoint
    await mockServer
      .forPost(
        /https:\/\/subscription\.dev-api\.cx\.metamask\.io\/v1\/subscriptions\/[^/]+\/cancel$/u,
      )
      .thenCallback(() => {
        cancelAtPeriodEnd = true;
        return {
          statusCode: 200,
          json: { ...BASE_SHIELD_SUBSCRIPTION, cancelAtPeriodEnd },
        };
      }),

    // Mock renew subscription endpoint
    await mockServer
      .forPost(
        /https:\/\/subscription\.dev-api\.cx\.metamask\.io\/v1\/subscriptions\/[^/]+\/uncancel$/u,
      )
      .thenCallback(() => {
        cancelAtPeriodEnd = false;
        return {
          statusCode: 200,
          json: { ...BASE_SHIELD_SUBSCRIPTION, cancelAtPeriodEnd },
        };
      }),
  ];
}

describe('Shield Plan Stripe Integration', function () {
  it('should successfully fill and submit shield claim form', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockStripeSubscriptionFlow,
      },
      async ({ driver }) => {
        // Login and validate balance
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();

        // Navigate to Shield Detail page
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToTransactionShieldPage();

        const shieldDetailPage = new ShieldDetailPage(driver);
        await shieldDetailPage.checkPageIsLoaded();

        // Click Claim button to navigate to claim page
        await shieldDetailPage.clickSubmitCaseButton();
        console.log('Navigated to Shield Claim page');

        const shieldClaimPage = new ShieldClaimPage(driver);
        await shieldClaimPage.checkPageIsLoaded();

        // Generate random test data
        const randomEmail = generateRandomEmail();
        const randomTxHash = generateRandomTxHash();
        const randomReimbursementAddress = generateRandomWalletAddress();
        const randomDescription = generateRandomDescription();

        // Fill the claim form with random data
        await shieldClaimPage.fillForm({
          email: randomEmail,
          reimbursementWalletAddress: randomReimbursementAddress,
          chainId: '0x1',
          impactedTxnHash: randomTxHash,
          impactedWalletName: 'Account 1',
          description: randomDescription,
        });

        // Submit the form
        await shieldClaimPage.clickSubmitButton();
        console.log('Claim form submitted successfully');

        // Check for success toast message
        await shieldClaimPage.checkSuccessMessageDisplayed();

        // Verify navigation to Shield Detail page
        await shieldDetailPage.checkPageIsLoaded();
      },
    );
  });

  it('should successfully cancel and renew subscription', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockStripeSubscriptionFlow,
      },
      async ({ driver }) => {
        // Login and validate balance
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToTransactionShieldPage();

        const shieldDetailPage = new ShieldDetailPage(driver);
        await shieldDetailPage.checkPageIsLoaded();

        // Cancel the subscription
        await shieldDetailPage.cancelSubscription();

        // Wait for cancellation confirmation and verify status
        await shieldDetailPage.checkNotificationShieldBanner(
          'Your membership will be cancelled on Nov 3, 2025.',
        );

        // Renew the subscription
        await shieldDetailPage.clickRenewButton();

        // Wait for renewal confirmation and verify status
        await shieldDetailPage.checkNotificationShieldBannerRemoved();
        await shieldDetailPage.checkMembershipStatus('Active membership');
      },
    );
  });
});
