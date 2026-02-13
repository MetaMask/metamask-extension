import { strict as assert } from 'assert';
import { MockedEndpoint, Mockttp } from 'mockttp';
import { decode, JwtPayload } from 'jsonwebtoken';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import { importWalletWithSocialLoginOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { AuthServer } from '../../helpers/seedless-onboarding/constants';
import LoginPage from '../../page-objects/pages/login-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { MOCK_GOOGLE_ACCOUNT } from '../../constants';

async function getMockedRequests(
  driver: Driver,
  mockedEndpoints: MockedEndpoint[],
) {
  await driver.wait(
    async () => {
      const pendingStatuses = await Promise.all(
        mockedEndpoints.map((mockedEndpoint) => mockedEndpoint.isPending()),
      );
      const isSomethingPending = pendingStatuses.some(
        (pendingStatus) => pendingStatus,
      );

      return !isSomethingPending;
    },
    driver.timeout,
    true,
  );

  const mockedRequests = [];
  for (const mockedEndpoint of mockedEndpoints) {
    mockedRequests.push(...(await mockedEndpoint.getSeenRequests()));
  }

  return mockedRequests;
}

describe('Refresh Auth Tokens (Seedless Onboarding)', function () {
  it('should refresh Auth Token when tokens are expired', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server, {
            forceTokenExpiration: true,
            userEmail: MOCK_GOOGLE_ACCOUNT,
          });
        },
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);

        // Go to the Privacy & Security Settings
        // Trigger the token refresh before locking the wallet
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        let mockedRequests = await getMockedRequests(driver, mockedEndpoints);

        const authServiceTokenRequests = mockedRequests.filter((req) =>
          req.url.includes(AuthServer.RequestToken),
        );

        // Assert that the token request API is called twice, first for social authentication and second for refresh token
        assert.strictEqual(authServiceTokenRequests.length, 2);

        // close the settings page
        await settingsPage.closeSettingsPage();

        // Lock the wallet
        await headerNavbar.lockMetaMask();

        // Unlock the wallet
        const loginPage = new LoginPage(driver);
        await loginPage.loginToHomepage();

        // Go to the Privacy & Security Settings
        await headerNavbar.openSettingsPage();
        // const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();

        // Inspect the marketing_opt_in API call
        mockedRequests = await getMockedRequests(driver, mockedEndpoints);
        const marketingOptInRequests = mockedRequests.filter((req) =>
          req.url.includes(AuthServer.GetMarketingOptInStatus),
        );
        assert.strictEqual(marketingOptInRequests.length, 3);

        // Extract the access token from the authorization header
        const marketingOptInRequestAfterTokenRefresh =
          marketingOptInRequests[1];
        const authorizationHeaders = marketingOptInRequestAfterTokenRefresh
          .headers.authorization as string;
        const accessToken = authorizationHeaders.split(' ')[1];

        // assert that the API call is using the latest refresh token by
        // decoding the access token and assert that the mode is 'refreshed'
        const decodedAccessToken = decode(accessToken);
        assert.strictEqual(
          (decodedAccessToken as JwtPayload).mode,
          'refreshed',
        );
      },
    );
  });

  it('should use valid Access Token after lock/unlock cycle', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server, {
            forceTokenExpiration: true,
            userEmail: MOCK_GOOGLE_ACCOUNT,
          });
        },
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // Lock the wallet after onboarding is finished
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.lockMetaMask();

        // Unlock the wallet again
        const loginPage = new LoginPage(driver);
        await loginPage.loginToHomepage();

        // Go to the Privacy & Security Settings
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();

        // Inspect the marketing_opt_in network call
        const mockedRequests = await getMockedRequests(driver, mockedEndpoints);
        const marketingOptInRequests = mockedRequests.filter((req) =>
          req.url.includes(AuthServer.GetMarketingOptInStatus),
        );

        // Assert that marketing_opt_in API was called
        assert.ok(
          marketingOptInRequests.length >= 1,
          'Expected at least one marketing_opt_in request',
        );

        // Extract and verify the access token from the authorization header
        const latestMarketingOptInRequest =
          marketingOptInRequests[marketingOptInRequests.length - 1];
        const authorizationHeader = latestMarketingOptInRequest.headers
          .authorization as string;

        assert.ok(
          authorizationHeader,
          'Expected authorization header to be present',
        );

        const accessToken = authorizationHeader.split(' ')[1];
        const decodedAccessToken = decode(accessToken);

        assert.strictEqual(
          (decodedAccessToken as JwtPayload).mode,
          'refreshed',
        );
      },
    );
  });
});
