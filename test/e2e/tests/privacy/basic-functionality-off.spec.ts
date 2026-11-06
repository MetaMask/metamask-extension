/**
 * Verifies that an already onboarded wallet only makes JSON-RPC requests while
 * basic functionality is off, apart from the hosts listed in
 * basic-functionality-off-known-violations.json.
 *
 */
import { Mockttp } from 'mockttp';
import { withFixtures, veryLargeDelayMs } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { closeSettings } from '../../page-objects/flows/settings.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { login } from '../../page-objects/flows/login.flow';
import {
  NonRpcRequests,
  assertNoNewNonRpcRequests,
  recordNonRpcRequests,
} from './helpers';

describe('Onboarded wallet with basic functionality off', function () {
  it('only makes RPC requests after unlocking', async function () {
    let getNonRpcRequests: () => Promise<NonRpcRequests> = async () =>
      new Map();
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withUseBasicFunctionalityDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          getNonRpcRequests = recordNonRpcRequests(server);
          return [];
        },
      },
      async ({ driver }) => {
        await login(driver, { waitForNonEvmAccounts: false });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await switchToNetworkFromNetworkSelect(driver, 'Ethereum');
        const tokensTab = new TokensTab(driver);
        await tokensTab.refreshErc20TokenList();

        // Intended delay: we assert on the absence of requests, so there is no
        // condition to wait for. This covers at least one polling cycle.
        await driver.delay(veryLargeDelayMs);

        await assertNoNewNonRpcRequests(getNonRpcRequests);
      },
    );
  });

  it('only makes RPC requests after turning it off in settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver, mockServer }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleBasicFunctionalityOff();
        await privacySettings.checkBasicFunctionalityIsOff();
        const getNonRpcRequests = recordNonRpcRequests(mockServer);
        await closeSettings(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await switchToNetworkFromNetworkSelect(driver, 'Ethereum');
        const tokensTab = new TokensTab(driver);
        await tokensTab.refreshErc20TokenList();

        // Intended delay: we assert on the absence of requests, so there is no
        // condition to wait for. This covers at least one polling cycle.
        await driver.delay(veryLargeDelayMs);

        await assertNoNewNonRpcRequests(getNonRpcRequests);
      },
    );
  });
});
