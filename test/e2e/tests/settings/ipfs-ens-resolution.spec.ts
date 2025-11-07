import { MockttpServer } from 'mockttp';
import { tinyDelayMs, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Settings', function () {
  const ENS_NAME = 'metamask.eth';
  const ENS_NAME_URL = `https://${ENS_NAME}/`;
  const ENS_DESTINATION_URL = `https://app.ens.domains/name/${ENS_NAME}`;

  it('Redirects to ENS domains when user inputs ENS into address bar', async function () {
    async function mockMetaMaskDotEth(mockServer: MockttpServer) {
      return await mockServer.forGet(ENS_NAME_URL).thenResetConnection();
    }
    async function mockEnsDotDomains(mockServer: MockttpServer) {
      return await mockServer
        .forGet(ENS_DESTINATION_URL)
        .thenReply(200, 'mocked ENS domain');
    }
    async function mockEns(mockServer: MockttpServer) {
      return [
        await mockMetaMaskDotEth(mockServer),
        await mockEnsDotDomains(mockServer),
      ];
    }
    // Using proxy port that doesn't resolve so that the browser can error out properly
    // on the ".eth" hostname. The proxy does too much interference with 8000.
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockEns,
        driverOptions: {
          proxyPort: '8001',
        },
      },
      async ({ driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();

        // The setting defaults to "on" so we can simply enter an ENS address
        // into the address bar and listen for address change
        try {
          await driver.openNewPage(ENS_NAME_URL);
        } catch (e) {
          // Ignore ERR_PROXY_CONNECTION_FAILED error
          // since all we care about is getting to the correct URL
        }

        // Ensure that the redirect to ENS Domains has happened
        await driver.waitForUrl({ url: ENS_DESTINATION_URL });
      },
    );
  });

  it('Does not fetch ENS data for ENS Domain when ENS and IPFS switched off', async function () {
    let server: MockttpServer;

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: MockttpServer) => {
          server = mockServer;
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // navigate to security & privacy settings screen
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        // turns off IPFS setting and ENS domain resolution
        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleIpfsGateway();
        await privacySettings.toggleEnsDomainResolution();

        // Now that we no longer need the MetaMask UI, and want the browser
        // to handle the request error, we need to stop the server
        await server.stop();

        try {
          await driver.openNewPage(ENS_NAME_URL);
        } catch (e) {
          // Ignore ERR_PROXY_CONNECTION_FAILED error
          // since all we care about is getting to the correct URL
        }

        // Ensure that the redirect to ENS Domains does not happen
        // Instead, the domain will be kept which is a 404
        await driver.wait(async () => {
          const currentUrl = await driver.getCurrentUrl();
          return currentUrl === ENS_NAME_URL;
        }, tinyDelayMs);
      },
    );
  });
});
