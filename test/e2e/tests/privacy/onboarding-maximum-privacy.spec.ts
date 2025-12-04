/**
 * This test verifies that with maximum privacy settings during onboarding enabled,
 * only allowlisted network calls are made during the onboarding process.
 *
 * It checks two critical phases during onboarding:
 * 1. During onboarding (before clicking "Done" on complete onboarding screen)
 * 2. After completing onboarding (on homepage without any user action)
 *
 * The allowlist is defined in privacy-max-allowlist-onboarding.json
 */
import { strict as assert } from 'assert';
import { promises as fs } from 'fs';
import path from 'path';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures, veryLargeDelayMs } from '../../helpers';
import { FEATURE_FLAGS_API_MOCK_RESULT } from '../../../data/mock-data';
import FixtureBuilder from '../../fixtures/fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import {
  importSRPOnboardingFlow,
  createNewWalletOnboardingFlow,
  handleSidepanelPostOnboarding,
} from '../../page-objects/flows/onboarding.flow';

const ALLOWLIST_FILE_NAME = 'privacy-max-allowlist-onboarding.json';

async function mockApis(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    // Mock Infura RPC endpoints
    await mockServer
      .forPost(/https:\/\/.*\.infura\.io\/v3\/.*/)
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1',
          result: '0x1',
        },
      })),
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/featureFlags')
      .thenCallback(() => ({
        statusCode: 200,
        json: FEATURE_FLAGS_API_MOCK_RESULT,
      })),
  ];
}

interface OnboardingAllowlist {
  duringOnboarding: string[];
  untilOnboardingComplete: string[];
}

async function loadAllowlist(): Promise<OnboardingAllowlist> {
  const allowlistPath = path.join(__dirname, ALLOWLIST_FILE_NAME);
  const allowlistRaw = await fs.readFile(allowlistPath, 'utf8');
  const allowlist: OnboardingAllowlist = JSON.parse(allowlistRaw);
  console.log('Privacy maximum onboarding allowlist loaded');
  return allowlist;
}

describe('Onboarding with Maximum Privacy Settings', function () {
  it('should only make allowlisted network calls during and after import wallet onboarding', async function () {
    const allowlist = await loadAllowlist();
    const capturedCalls = new Set<string>();

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockServer }) => {
        // Listen to all network requests and capture them
        mockServer.on(
          'request-initiated',
          (request: { headers: { host: string }; url: string }) => {
            const host = request.headers.host;
            if (host) {
              capturedCalls.add(host);
            }
          },
        );

        // Complete onboarding up to the complete page
        await importSRPOnboardingFlow({ driver });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();

        // Navigate to privacy settings and toggle them OFF (maximum privacy)
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage =
          new OnboardingPrivacySettingsPage(driver);
        await onboardingPrivacySettingsPage.checkPageIsLoaded();
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.toggleAssetsSettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.checkPageIsLoaded();

        // Intended delay to ensure we cover at least 1 polling loop for network requests
        await driver.delay(veryLargeDelayMs);

        // Check Phase 1: All calls until now should be in duringOnboarding allowlist
        const unexpectedCallsDuringOnboarding = [...capturedCalls].filter(
          (host) => !allowlist.duringOnboarding.includes(host),
        );

        console.log('Checking calls until complete onboarding screen');
        console.log('Total calls made during onboarding:', capturedCalls.size);
        console.log('Calls made during onboarding:', JSON.stringify([...capturedCalls].sort(), null, 2));

        // Assert no unexpected hosts during onboarding
        assert.equal(
          unexpectedCallsDuringOnboarding.length,
          0,
          `Unexpected network calls during onboarding:\n${unexpectedCallsDuringOnboarding
            .map((host) => `  - ${host}`)
            .join('\n')}\n\nThese hosts are NOT in the duringOnboarding allowlist.\nIf these are expected, add them to privacy-max-allowlist-onboarding.json`,
        );

        // Complete onboarding and go to homepage
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // Intended delay to ensure we cover at least 1 polling loop for network requests
        await driver.delay(veryLargeDelayMs);

        // Check Phase 2: All calls (including previous ones) should be in untilOnboardingComplete allowlist
        const unexpectedCallsAfterOnboardingComplete = [...capturedCalls].filter(
          (host) => !allowlist.untilOnboardingComplete.includes(host),
        );

        console.log('Checking calls until homepage');
        console.log('Total calls made until landing on homepage:', capturedCalls.size);
        console.log('Calls made until landing on homepage:', JSON.stringify([...capturedCalls].sort(), null, 2));

        // Assert no unexpected hosts after onboarding complete
        assert.equal(
          unexpectedCallsAfterOnboardingComplete.length,
          0,
          `Unexpected network calls after onboarding complete:\n${unexpectedCallsAfterOnboardingComplete
            .map((host) => `  - ${host}`)
            .join('\n')}\n\nThese hosts are NOT in the untilOnboardingComplete allowlist.\nIf these are expected, add them to privacy-max-allowlist-onboarding.json`,
        );
      },
    );
  });

  it('should only make allowlisted network calls during and after create new wallet onboarding', async function () {
    const allowlist = await loadAllowlist();
    const capturedCalls = new Set<string>();

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockServer }) => {
        // Listen to all network requests and capture them
        mockServer.on(
          'request-initiated',
          (request: { headers: { host: string }; url: string }) => {
            const host = request.headers.host;
            if (host) {
              capturedCalls.add(host);
            }
          },
        );

        // Complete onboarding up to the complete page
        await createNewWalletOnboardingFlow({ driver });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();

        // Navigate to privacy settings and toggle them OFF (maximum privacy)
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage =
          new OnboardingPrivacySettingsPage(driver);
        await onboardingPrivacySettingsPage.checkPageIsLoaded();
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.toggleAssetsSettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.checkPageIsLoaded();

        // Intended delay to ensure we cover at least 1 polling loop for network requests
        await driver.delay(veryLargeDelayMs);

        // Check Phase 1: All calls until now should be in duringOnboarding allowlist
        const unexpectedCallsDuringOnboarding = [...capturedCalls].filter(
          (host) => !allowlist.duringOnboarding.includes(host),
        );

        console.log('Checking calls until complete onboarding screen');
        console.log('Total calls made during onboarding:', capturedCalls.size);
        console.log('Calls made during onboarding:', JSON.stringify([...capturedCalls].sort(), null, 2));

        // Assert no unexpected hosts during onboarding
        assert.equal(
          unexpectedCallsDuringOnboarding.length,
          0,
          `Unexpected network calls during onboarding:\n${unexpectedCallsDuringOnboarding
            .map((host) => `  - ${host}`)
            .join('\n')}\n\nThese hosts are NOT in the duringOnboarding allowlist.\nIf these are expected, add them to privacy-max-allowlist-onboarding.json`,
        );

        // Complete onboarding and go to homepage
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // Intended delay to ensure we cover at least 1 polling loop for network requests
        await driver.delay(veryLargeDelayMs);

        // Check Phase 2: All calls (including previous ones) should be in untilOnboardingComplete allowlist
        const unexpectedCallsAfterOnboardingComplete = [...capturedCalls].filter(
          (host) => !allowlist.untilOnboardingComplete.includes(host),
        );

        console.log('Checking calls until homepage');
        console.log('Total calls made until landing on homepage:', capturedCalls.size);
        console.log('Calls made until landing on homepage:', JSON.stringify([...capturedCalls].sort(), null, 2));

        // Assert no unexpected hosts after onboarding complete
        assert.equal(
          unexpectedCallsAfterOnboardingComplete.length,
          0,
          `Unexpected network calls after onboarding complete:\n${unexpectedCallsAfterOnboardingComplete
            .map((host) => `  - ${host}`)
            .join('\n')}\n\nThese hosts are NOT in the untilOnboardingComplete allowlist.\nIf these are expected, add them to privacy-max-allowlist-onboarding.json`,
        );
      },
    );
  });
});
