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
import ShieldClaimsListPage from '../../page-objects/pages/settings/shield/shield-claims-list-page';
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

async function mockStripeSubscriptionFlow(
  mockServer: Mockttp,
  testData?: {
    email: string;
    impactedTxHash: string;
    reimbursementWalletAddress: string;
    description: string;
  },
) {
  const userStorageMockttpController = new UserStorageMockttpController();
  userStorageMockttpController.setupPath(
    USER_STORAGE_FEATURE_NAMES.accounts,
    mockServer,
  );

  // Shared state across requests
  let cancelAtPeriodEnd = false;

  // Use provided test data or default values
  const claimData = testData || {
    email: 'test@metamask.io',
    impactedTxHash:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    reimbursementWalletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    description: 'This is a test claim description',
  };

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
      .forPost(/https:\/\/.*\.cx\.metamask\.io\/claims/u)
      .thenJson(200, SHIELD_CLAIMS_RESPONSE),

    // Mock GET claims endpoint - returns list of claims
    // Returns a mock claim after submission, empty array otherwise
    await mockServer
      .forGet(/https:\/\/.*\.cx\.metamask\.io\/claims/u)
      .thenJson(200, [
        {
          id: SHIELD_CLAIMS_RESPONSE.claimId,
          shortId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          chainId: '1',
          email: claimData.email,
          impactedWalletAddress: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          impactedTxHash: claimData.impactedTxHash,
          reimbursementWalletAddress: claimData.reimbursementWalletAddress,
          description: claimData.description,
          attachments: [],
          intercomId: `intercom_${SHIELD_CLAIMS_RESPONSE.claimId}`,
          status: 'created',
        },
      ]),

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
  // TODO: This test is skipped until the claim form is implemented with the final design.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should successfully fill and submit shield claim form', async function () {
    // Generate test data before the test runs so it can be reused in mocks
    const testData = {
      email: generateRandomEmail(),
      impactedTxHash: generateRandomTxHash(),
      reimbursementWalletAddress: generateRandomWalletAddress(),
      description: generateRandomDescription(),
    };

    await withFixtures(
      {
        fixtures: createShieldFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockStripeSubscriptionFlow(mockServer, testData),
        ignoredConsoleErrors: [
          // Rive WASM loading fails in test environment due to XMLHttpRequest limitations
          'Could not load Rive WASM file',
          'XMLHttpRequest is not a constructor',
        ],
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

        const shieldClaimPage = new ShieldClaimPage(driver);
        await shieldClaimPage.checkPageIsLoaded();

        // Fill the claim form with test data
        await shieldClaimPage.fillForm({
          email: testData.email,
          reimbursementWalletAddress: testData.reimbursementWalletAddress,
          chainId: '0x1',
          impactedTxnHash: testData.impactedTxHash,
          impactedWalletName: 'Account 1',
          description: testData.description,
        });

        // Submit the form
        await shieldClaimPage.clickSubmitButton();

        // Check for success toast message
        await shieldClaimPage.checkSuccessMessageDisplayed();

        // Verify navigation to Claims List page
        const shieldClaimsListPage = new ShieldClaimsListPage(driver);
        await shieldClaimsListPage.checkPageIsLoaded();

        // Check that the claim is created with status "Created" (pending status)
        const { claimId } = SHIELD_CLAIMS_RESPONSE;
        await shieldClaimsListPage.checkClaimExists(claimId);
        await shieldClaimsListPage.checkClaimStatus(claimId, 'Created');

        // Click on the claim item to view details
        await shieldClaimsListPage.clickClaimItem(claimId);

        // Verify navigation to Claim detail page (view mode) and check data is displayed correctly
        await shieldClaimPage.checkPageIsLoadedInViewMode();
        await shieldClaimPage.verifyClaimData({
          email: testData.email,
          reimbursementWalletAddress: testData.reimbursementWalletAddress,
          impactedTxHash: testData.impactedTxHash,
          description: testData.description,
        });
      },
    );
  });

  it('should successfully cancel and renew subscription', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockStripeSubscriptionFlow,
        ignoredConsoleErrors: [
          // Rive WASM loading fails in test environment due to XMLHttpRequest limitations
          'Could not load Rive WASM file',
          'XMLHttpRequest is not a constructor',
        ],
      },
      async ({ driver }) => {
        // Login and validate balance
        await loginWithBalanceValidation(driver);

        await driver.delay(1000);
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
