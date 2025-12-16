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
  it('should successfully fill and submit shield claim form', async function () {
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

        const shieldClaimPage = new ShieldClaimPage(driver);
        await shieldClaimPage.checkPageIsLoaded();

        await shieldClaimPage.fillForm({
          email: MOCK_CLAIM_2.email,
          reimbursementWalletAddress: MOCK_CLAIM_2.reimbursementWalletAddress,
          chainId: '0x1',
          impactedTxnHash: MOCK_CLAIM_2.impactedTxHash,
          impactedWalletName: 'Account 1',
          description: MOCK_CLAIM_2.description,
        });

        await shieldClaimPage.clickSubmitButton();

        await shieldClaimPage.checkSuccessMessageDisplayed();

        const shieldClaimsListPage = new ShieldClaimsListPage(driver);
        await shieldClaimsListPage.checkPageIsLoaded();

        const { claimId } = SUBMIT_CLAIMS_RESPONSE;
        await shieldClaimsListPage.checkClaimExists(claimId);
        await shieldClaimsListPage.checkClaimStatus(claimId, 'Created');

        await shieldClaimsListPage.clickClaimItem(claimId);

        await shieldClaimPage.checkPageIsLoadedInViewMode();
        await shieldClaimPage.verifyClaimData({
          email: MOCK_CLAIM_2.email,
          reimbursementWalletAddress: MOCK_CLAIM_2.reimbursementWalletAddress,
          impactedTxHash: MOCK_CLAIM_2.impactedTxHash,
          description: MOCK_CLAIM_2.description,
        });
      },
    );
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
