import { strict as assert } from 'assert';
import {
  withFixtures,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  defaultGanacheOptions,
} from '../../helpers';
import { METAMASK_STALELIST_URL } from '../phishing-controller/helpers';
import { Driver } from '../../webdriver/driver';

import { importSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import HomePage from '../../page-objects/pages/homepage';
import FixtureBuilder from '../../fixture-builder';
import { Mockttp, MockedEndpoint } from '../../mock-e2e';

async function mockApis(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  return [
    await mockServer.forGet('https://token.api.cx.metamask.io/tokens/1').thenCallback(() => {
      return {
        statusCode: 200,
        json: [{ fakedata: true }],
      };
    }),
/*     await mockServer.forGet('https://bridge.api.cx.metamask.io/getAllFeatureFlags').thenCallback(() => {
      return {
        statusCode: 200,
        json: [{ fakedata: true }],
      };
    }),
    await mockServer.forGet('https://on-ramp-content.api.cx.metamask.io/regions/networks').thenCallback(() => {
      return {
        statusCode: 200,
        json: [{ fakedata: true }],
      };
    }),
    await mockServer.forGet('https://chainid.network/chains.json').thenCallback(() => {
      return {
        statusCode: 200,
        json: [{ fakedata: true }],
      };
    }), */
  ];
}

describe('MetaMask onboarding @no-mmi', () => {
   it('should prevent network requests to advanced functionality endpoints when the advanced functionality toggle is off', async () => {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).withNetworkControllerOnMainnet().build(),
        //fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: 'Advanced functionality toggle off test',
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint }) => {
        await driver.navigate();
        await importSRPOnboardingFlow(driver);

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(driver);
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.toggleAssetsSettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });
        await driver.assertElementNotPresent('.loading-overlay');

        await homePage.refreshTokenList();

        // Refresh tokens before asserting to mitigate flakiness
        for (let i = 0; i < mockedEndpoint.length; i += 1) {
          const requests = await mockedEndpoint[i].getSeenRequests();
          assert.ok(
            requests.length === 0,
            `${mockedEndpoint[i]} should not make requests after onboarding`,
          );
        }
      },
    );
  });

    it('should not prevent network requests to advanced functionality endpoints when the advanced functionality toggle is on', async () => {
    await withFixtures(
      {
        //fixtures: new FixtureBuilder({ onboarding: true }).withNetworkControllerOnMainnet().build(),
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: 'Advanced functionality toggle on test',
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint }) => {
        await importSRPOnboardingFlow(driver);
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });

        // Wait until network is fully switched and refresh tokens before asserting to mitigate flakiness
        await driver.assertElementNotPresent('.loading-overlay');

        await homePage.refreshTokenList();

        // Refresh tokens before asserting to mitigate flakiness
        for (let i = 0; i < mockedEndpoint.length; i += 1) {
          const requests = await mockedEndpoint[i].getSeenRequests();
          assert.ok(
            requests.length > 0,
            `${mockedEndpoint[i]} should not make requests after onboarding`,
          );
        }
      },
    );
  });
});
