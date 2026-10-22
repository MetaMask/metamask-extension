/**
 * Verifies the network calls made when basic functionality (and the other
 * privacy settings) are turned off during onboarding, for each onboarding
 * path: SRP import and new wallet with MetaMetrics enabled. Social login is
 * not covered because it keeps basic functionality locked on.
 *
 * 1. Before clicking "Done" on the onboarding complete page: every host must
 *    be in the `duringOnboarding` list of onboarding-allowlist.json (plus
 *    `additionalDuringOnboardingWithMetaMetrics` when MetaMetrics is enabled).
 * 2. After turning basic functionality off (until the homepage, including a
 *    network switch and a token refresh): only JSON-RPC requests are allowed,
 *    apart from the hosts listed in basic-functionality-off-known-violations.json.
 *    The stalelist and NFT APIs are also asserted explicitly, because their
 *    hosts are known violations in other scenarios.
 */
import { strict as assert } from 'assert';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures, veryLargeDelayMs } from '../../helpers';
import { FEATURE_FLAGS_API_MOCK_RESULT } from '../../../data/mock-data';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import {
  importSRPOnboardingFlow,
  createNewWalletOnboardingFlow,
  handleSidepanelPostOnboarding,
} from '../../page-objects/flows/onboarding.flow';
import { METAMASK_STALELIST_URL } from '../phishing-controller/helpers';
import {
  assertNoNewNonRpcRequests,
  assertOnlyOnboardingAllowlistedHosts,
  recordNonRpcRequests,
  recordRequestedHosts,
} from './helpers';

// Turning basic functionality off disables the remote feature flag
// controller, so the network filter would otherwise fall back to its
// pre-redesign variant.
const manifestFlags = {
  remoteFeatureFlags: {
    extensionUxNetworkManagement: {
      enabled: true,
      minimumVersion: '13.36.0',
    },
  },
};

async function mockApis(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  await mockServer
    .forPost(/https:\/\/.*\.infura\.io\/v3\/.*/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '1',
        result: '0x1',
      },
    }));
  await mockServer
    .forGet('https://bridge.api.cx.metamask.io/featureFlags')
    .thenCallback(() => ({
      statusCode: 200,
      json: FEATURE_FLAGS_API_MOCK_RESULT,
    }));
  // Mock chainid.network used by NetworkEnablementController
  await mockServer
    .forGet(/https:\/\/chainid\.network\/.*/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: [],
    }));

  return [
    await mockServer.forGet(METAMASK_STALELIST_URL).thenCallback(() => ({
      statusCode: 200,
      json: [{ fakedata: true }],
    })),
    await mockServer
      .forGet(/https:\/\/nft\.api\.cx\.metamask\.io\/users\/.*\/tokens/u)
      .thenCallback(() => ({
        statusCode: 200,
        json: { tokens: [] },
      })),
  ];
}

async function assertNoRequestsToMockedEndpoints(
  mockedEndpoints: MockedEndpoint[],
): Promise<void> {
  for (const mockedEndpoint of mockedEndpoints) {
    const requests = await mockedEndpoint.getSeenRequests();
    assert.equal(
      requests.length,
      0,
      `${mockedEndpoint.toString()} should make no requests with basic functionality off`,
    );
  }
}

describe('Onboarding with basic functionality off', function () {
  it('only makes allowed network calls when importing a wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        manifestFlags,
        testSpecificMock: mockApis,
      },
      async ({ driver, mockServer, mockedEndpoint: mockedEndpoints }) => {
        const requestedHosts = recordRequestedHosts(mockServer);

        await importSRPOnboardingFlow({ driver });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );
        await onboardingPrivacySettingsPage.checkPageIsLoaded();
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.togglePrivacySettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.checkPageIsLoaded();
        const getNonRpcRequests = recordNonRpcRequests(mockServer);

        // Intended delay to ensure we cover at least 1 polling loop for network requests
        await driver.delay(veryLargeDelayMs);

        // Phase 1: all calls until now should be in the duringOnboarding allowlist
        await assertOnlyOnboardingAllowlistedHosts(requestedHosts);

        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await switchToNetworkFromNetworkSelect(driver, 'Ethereum');
        const tokensTab = new TokensTab(driver);
        await tokensTab.refreshErc20TokenList();

        // Intended delay: we assert on the absence of requests, so there is no
        // condition to wait for. This covers at least one polling cycle.
        await driver.delay(veryLargeDelayMs);

        // Phase 2: only JSON-RPC requests since basic functionality was turned off
        await assertNoNewNonRpcRequests(getNonRpcRequests);
        await assertNoRequestsToMockedEndpoints(mockedEndpoints);
      },
    );
  });

  it('only makes allowed network calls when creating a new wallet with MetaMetrics enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        manifestFlags,
        testSpecificMock: mockApis,
      },
      async ({ driver, mockServer, mockedEndpoint: mockedEndpoints }) => {
        const requestedHosts = recordRequestedHosts(mockServer);

        await createNewWalletOnboardingFlow({ driver, optedIn: true });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );
        await onboardingPrivacySettingsPage.checkPageIsLoaded();
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.togglePrivacySettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.checkPageIsLoaded();
        const getNonRpcRequests = recordNonRpcRequests(mockServer);

        // Intended delay to ensure we cover at least 1 polling loop for network requests
        await driver.delay(veryLargeDelayMs);

        // Phase 1: all calls until now should be in the duringOnboarding and
        // additionalDuringOnboardingWithMetaMetrics allowlists
        await assertOnlyOnboardingAllowlistedHosts(requestedHosts, {
          withMetaMetrics: true,
        });

        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await switchToNetworkFromNetworkSelect(driver, 'Ethereum');
        const tokensTab = new TokensTab(driver);
        await tokensTab.refreshErc20TokenList();

        // Intended delay: we assert on the absence of requests, so there is no
        // condition to wait for. This covers at least one polling cycle.
        await driver.delay(veryLargeDelayMs);

        // Phase 2: only JSON-RPC requests since basic functionality was turned off
        await assertNoNewNonRpcRequests(getNonRpcRequests);
        await assertNoRequestsToMockedEndpoints(mockedEndpoints);
      },
    );
  });
});
