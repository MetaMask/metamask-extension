import { MockedEndpoint, MockttpServer } from 'mockttp';
import { getCleanAppState, tinyDelayMs, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';
import { NETWORK_CLIENT_ID } from '../../constants';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getCurrentChainId } from '../../../../shared/lib/selectors/networks';

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
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockEns,
        driverOptions: {
          proxyPort: '8001',
        },
      },
      async ({ driver }) => {
        await driver.navigate();

        // Wait for the live controller state (via Redux) to confirm the
        // ipfsGateway and useAddressBarEnsResolution settings are active.
        // Unlike getPersistedState (which reads IndexedDB fixture data
        // immediately), getCleanAppState reflects the running controller
        // state that has been synced to the UI after background init.
        // Wait until NetworkController state resolves to mainnet.
        await driver.waitUntil(
          async () => {
            const uiState = await getCleanAppState(driver);
            const m = uiState?.metamask;
            if (
              m?.ipfsGateway !== 'dweb.link' ||
              m?.useAddressBarEnsResolution !== true
            ) {
              return false;
            }
            try {
              return getCurrentChainId({ metamask: m }) === CHAIN_IDS.MAINNET;
            } catch {
              return false;
            }
          },
          {
            interval: 1000,
            stableFor: 2000,
            timeout: 10000,
          },
        );

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
    async function ensDomainPassthrough(
      mockServer: MockttpServer,
    ): Promise<MockedEndpoint[]> {
      // We want the browser to handle the request error
      const ensNamePassThrough = await mockServer
        .forGet(ENS_NAME_URL)
        .thenPassThrough();
      // This should never be hit, but in case it is, then we'll catch it
      const ensDomainsPassThrough = await mockServer
        .forGet(ENS_DESTINATION_URL)
        .thenPassThrough();

      return [ensNamePassThrough, ensDomainsPassThrough];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: ensDomainPassthrough,
      },
      async ({ driver }) => {
        await login(driver);

        // navigate to security & privacy settings screen
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        // turns off IPFS setting and ENS domain resolution
        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.goToThirdPartyApisSettings();
        await privacySettings.toggleIpfsGateway();
        await privacySettings.toggleEnsDomainResolution();

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
