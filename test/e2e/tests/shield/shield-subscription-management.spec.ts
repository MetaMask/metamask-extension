import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import ShieldDetailPage from '../../page-objects/pages/settings/shield/shield-detail-page';
import ShieldClaimPage from '../../page-objects/pages/settings/shield/shield-claim-page';
import ShieldClaimsListPage from '../../page-objects/pages/settings/shield/shield-claims-list-page';
import ShieldSubscriptionApprovePage from '../../page-objects/pages/settings/shield/shield-subscription-approve-page';
import {
  MOCK_CLAIM_2,
  MOCK_CLAIM_APPROVED,
  SUBMIT_CLAIMS_RESPONSE,
  MOCK_CLAIMS_WITH_HISTORY,
  MOCK_CLAIMS_3_PENDING,
} from '../../helpers/shield/constants';
import { ShieldMockttpService } from '../../helpers/shield/mocks';

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

// Local fixture for crypto payment tests with USDC and USDT
function createShieldFixtureCrypto() {
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
      showShieldEntryModalOnce: null,
    });
}

describe('Shield Plan Stripe Integration', function () {
  describe('Shield Claims', function () {
    it('submits shield claim successfully and check claim details correctly', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (mockServer: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(mockServer, {
              isActiveUser: true,
            });
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.waitForNetworkAndDOMReady();

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.checkPageIsLoaded();

          await shieldDetailPage.clickSubmitCaseButton();

          const shieldClaimsListPage = new ShieldClaimsListPage(driver);
          await shieldClaimsListPage.checkPageIsLoaded();
          await shieldClaimsListPage.clickSubmitClaimButton();

          const shieldClaimPage = new ShieldClaimPage(driver);
          await shieldClaimPage.checkPageIsLoaded();

          await shieldClaimPage.fillForm({
            email: MOCK_CLAIM_2.email,
            reimbursementWalletAddress: MOCK_CLAIM_2.reimbursementWalletAddress,
            chainId: '0x1',
            impactedTxnHash: MOCK_CLAIM_2.impactedTxHash,
            impactedWalletName: 'Account 1',
            description: MOCK_CLAIM_2.description,
            uploadTestFile: true,
          });

          await shieldClaimPage.clickSubmitButton();

          await shieldClaimPage.checkSuccessMessageDisplayed();

          await shieldClaimsListPage.checkPageIsLoaded();

          const { claimId } = SUBMIT_CLAIMS_RESPONSE;
          await shieldClaimsListPage.checkClaimExists(claimId);
          await shieldClaimsListPage.clickClaimItem(claimId);

          await shieldClaimPage.checkPageIsLoadedInViewMode();
          await shieldClaimPage.verifyClaimData({
            email: MOCK_CLAIM_2.email,
            reimbursementWalletAddress: MOCK_CLAIM_2.reimbursementWalletAddress,
            impactedTxHash: MOCK_CLAIM_2.impactedTxHash,
            description: MOCK_CLAIM_2.description,
            uploadedFileName: 'test-document.pdf',
          });
        },
      );
    });

    it('displays error when transaction is not eligible', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (mockServer: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(mockServer, {
              isActiveUser: true,
              claimErrorCode: 'E102', // TRANSACTION_NOT_ELIGIBLE
            });
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.waitForNetworkAndDOMReady();

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.checkPageIsLoaded();

          await shieldDetailPage.clickSubmitCaseButton();

          const shieldClaimsListPage = new ShieldClaimsListPage(driver);
          await shieldClaimsListPage.checkPageIsLoaded();
          await shieldClaimsListPage.clickSubmitClaimButton();

          const shieldClaimPage = new ShieldClaimPage(driver);
          await shieldClaimPage.checkPageIsLoaded();

          await shieldClaimPage.fillForm({
            email: MOCK_CLAIM_2.email,
            reimbursementWalletAddress: MOCK_CLAIM_2.reimbursementWalletAddress,
            chainId: '0x1',
            impactedTxnHash: MOCK_CLAIM_2.impactedTxHash,
            impactedWalletName: 'Account 1',
            description: MOCK_CLAIM_2.description,
            uploadTestFile: true,
          });

          await shieldClaimPage.clickSubmitButton();

          await shieldClaimPage.verifyFieldError(
            'This transaction is not done within MetaMask, hence it is not eligible for claims',
          );
        },
      );
    });

    it('displays error toast when duplicate transaction hash is submitted', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (mockServer: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(mockServer, {
              isActiveUser: true,
              claimErrorCode: 'E203', // DUPLICATE_CLAIM_EXISTS
            });
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.waitForNetworkAndDOMReady();

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.checkPageIsLoaded();

          await shieldDetailPage.clickSubmitCaseButton();

          const shieldClaimsListPage = new ShieldClaimsListPage(driver);
          await shieldClaimsListPage.checkPageIsLoaded();
          await shieldClaimsListPage.clickSubmitClaimButton();

          const shieldClaimPage = new ShieldClaimPage(driver);
          await shieldClaimPage.checkPageIsLoaded();

          await shieldClaimPage.fillForm({
            email: MOCK_CLAIM_2.email,
            reimbursementWalletAddress: MOCK_CLAIM_2.reimbursementWalletAddress,
            chainId: '0x1',
            impactedTxnHash: MOCK_CLAIM_2.impactedTxHash,
            impactedWalletName: 'Account 1',
            description: MOCK_CLAIM_2.description,
            uploadTestFile: true,
          });

          await shieldClaimPage.clickSubmitButton();

          await shieldClaimPage.verifyToastError(
            'A claim has already been submitted for this transaction hash.',
          );
        },
      );
    });

    it('displays empty state when Claims and History tabs have no data', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (mockServer: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(mockServer, {
              isActiveUser: true,
              claimsResponse: [], // Empty claims array
            });
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.waitForNetworkAndDOMReady();

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.checkPageIsLoaded();

          await shieldDetailPage.clickSubmitCaseButton();

          const shieldClaimsListPage = new ShieldClaimsListPage(driver);
          await shieldClaimsListPage.checkPageIsLoaded();

          await shieldClaimsListPage.checkPendingTabEmptyState();

          await shieldClaimsListPage.clickHistoryTab();
          await shieldClaimsListPage.checkHistoryTabEmptyState();
        },
      );
    });

    it('displays claims data when Claims and History tabs have data', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (mockServer: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(mockServer, {
              isActiveUser: true,
              claimsResponse: MOCK_CLAIMS_WITH_HISTORY, // Claims with pending, approved, and rejected
            });
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.waitForNetworkAndDOMReady();

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.checkPageIsLoaded();

          await shieldDetailPage.clickSubmitCaseButton();

          const shieldClaimsListPage = new ShieldClaimsListPage(driver);
          await shieldClaimsListPage.checkPageIsLoaded();

          await shieldClaimsListPage.checkPendingClaimsDisplayed();
          await shieldClaimsListPage.checkClaimExists('test_claim_id_00001');

          await shieldClaimsListPage.clickHistoryTab();
          await shieldClaimsListPage.checkCompletedClaimsDisplayed();
          await shieldClaimsListPage.checkRejectedClaimsDisplayed();
          await shieldClaimsListPage.checkClaimExists('test_claim_id_approved');
          await shieldClaimsListPage.checkClaimExists('test_claim_id_rejected');

          await shieldClaimsListPage.clickClaimItem('test_claim_id_approved');

          const shieldClaimPage = new ShieldClaimPage(driver);
          await shieldClaimPage.checkPageIsLoadedInViewMode();
          await shieldClaimPage.verifyClaimData({
            email: MOCK_CLAIM_APPROVED.email,
            reimbursementWalletAddress:
              MOCK_CLAIM_APPROVED.reimbursementWalletAddress,
            impactedTxHash: MOCK_CLAIM_APPROVED.impactedTxHash,
            description: MOCK_CLAIM_APPROVED.description,
          });

          await shieldClaimPage.clickBackButton();

          await shieldClaimsListPage.checkPageIsLoaded();
          await shieldClaimsListPage.checkCompletedClaimsDisplayed();
          await shieldClaimsListPage.checkClaimExists('test_claim_id_approved');
        },
      );
    });

    it('displays 3 pending claims with maximum limit note', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (mockServer: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(mockServer, {
              isActiveUser: true,
              claimsResponse: MOCK_CLAIMS_3_PENDING, // 3 pending claims (maximum limit)
            });
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.waitForNetworkAndDOMReady();

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.checkPageIsLoaded();

          await shieldDetailPage.clickSubmitCaseButton();

          const shieldClaimsListPage = new ShieldClaimsListPage(driver);
          await shieldClaimsListPage.checkPageIsLoaded();

          await shieldClaimsListPage.checkPendingClaimsDisplayed();
          await shieldClaimsListPage.checkThreeClaimsDisplayed();

          await shieldClaimsListPage.checkClaimExists('test_claim_id_00001');
          await shieldClaimsListPage.checkClaimExists('test_claim_id_00002');
          await shieldClaimsListPage.checkClaimExists('test_claim_id_00003');

          await shieldClaimsListPage.checkSubmitClaimButtonDisabled();
        },
      );
    });
  });

  it('should successfully cancel and renew subscription', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          const shieldMockttpService = new ShieldMockttpService();
          return shieldMockttpService.setup(server, { isActiveUser: true });
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNetworkAndDOMReady();

        await new HeaderNavbar(driver).openSettingsPage();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToTransactionShieldPage();

        const shieldDetailPage = new ShieldDetailPage(driver);
        await shieldDetailPage.checkPageIsLoaded();

        // Cancel the subscription
        await shieldDetailPage.cancelSubscription();

        await shieldDetailPage.checkNotificationShieldBanner(
          'Your plan will be cancelled on Nov 3, 2025.',
        );

        // Renew the subscription
        await shieldDetailPage.clickRenewButton();

        await shieldDetailPage.checkNotificationShieldBannerRemoved();
        await shieldDetailPage.checkMembershipStatus('Active plan');
      },
    );
  });

  it('should be able to change payment method from crypto to crypto (USDC -> USDT)', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixtureCrypto().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          const shieldMockttpService = new ShieldMockttpService();
          return shieldMockttpService.setup(server, {
            isActiveUser: true,
            defaultPaymentMethod: 'crypto',
          });
        },
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
        await homePage.checkPageIsLoaded();
        await homePage.waitForNetworkAndDOMReady();

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToTransactionShieldPage();

        const shieldDetailPage = new ShieldDetailPage(driver);
        await shieldDetailPage.checkPageIsLoaded();

        await shieldDetailPage.checkPaymentMethod('USDC');
        await shieldDetailPage.clickPaymentMethod();

        await shieldDetailPage.selectPaymentMethodInModal('Pay with USDT');

        const shieldSubscriptionApprovePage = new ShieldSubscriptionApprovePage(
          driver,
        );
        await shieldSubscriptionApprovePage.checkPageIsLoaded();
        await shieldSubscriptionApprovePage.checkPaymentMethodInEstimatedChanges(
          'USDT',
        );

        await shieldSubscriptionApprovePage.clickFooterConfirmButton();
        await shieldDetailPage.checkPageIsLoaded();
        await shieldDetailPage.checkPaymentMethod('USDT');
      },
    );
  });
});
