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
import {
  MOCK_CLAIM_2,
  SUBMIT_CLAIMS_RESPONSE,
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
});
