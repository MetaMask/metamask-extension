import assert from 'assert';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AccountList from '../../page-objects/pages/account-list-page';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import {
  importSRPOnboardingFlow,
  completeImportSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';

async function mockApis(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forGet('https://token.api.cx.metamask.io/tokens/1')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [{ fakedata: true }],
        };
      }),
    await mockServer
      .forGet('https://on-ramp-content.api.cx.metamask.io/regions/networks')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [{ fakedata: true }],
        };
      }),
    await mockServer
      .forGet('https://chainid.network/chains.json')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [{ fakedata: true }],
        };
      }),
    // TODO: Enable this mock once bug #32312 is resolved: https://github.com/MetaMask/metamask-extension/issues/32312
    /*
    await mockServer
      .forGet('https://accounts.api.cx.metamask.io/v2/activeNetworks')
      .thenCallback(() => ({
        statusCode: 200,
        json: [{ fakedata: true }]
      })),
    */
  ];
}
describe('MetaMask onboarding ', function () {
  it('should prevent network requests to advanced functionality endpoints when the advanced assets functionality toggle is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint }) => {
        await importSRPOnboardingFlow({ driver });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.toggleAssetsSettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        // Refresh tokens before asserting to mitigate flakiness
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed();
        await homePage.refreshErc20TokenList();
        await homePage.checkPageIsLoaded();
        await homePage.headerNavbar.openAccountMenu();
        await new AccountList(driver).checkPageIsLoaded();

        for (const m of mockedEndpoint) {
          const requests = await m.getSeenRequests();
          assert.ok(
            requests.length === 0,
            `${m} should not make requests after onboarding`,
          );
        }
      },
    );
  });

  it('should not prevent network requests to advanced functionality endpoints when the advanced assets functionality toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint }) => {
        await completeImportSRPOnboardingFlow({ driver });

        // Refresh tokens before asserting to mitigate flakiness
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed();
        await homePage.refreshErc20TokenList();
        await homePage.checkPageIsLoaded();
        await homePage.headerNavbar.openAccountMenu();
        await new AccountList(driver).checkPageIsLoaded();

        // intended delay to allow for network requests to complete
        await driver.delay(1000);
        for (const m of mockedEndpoint) {
          const requests = await m.getSeenRequests();
          assert.equal(
            requests.length,
            1,
            `${m} should make requests after onboarding`,
          );
        }
      },
    );
  });
});
