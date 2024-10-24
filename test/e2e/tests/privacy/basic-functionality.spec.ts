const assert = require('assert').strict;
const {
  TEST_SEED_PHRASE,
  withFixtures,
  importSRPOnboardingFlow,
  WALLET_PASSWORD,
  defaultGanacheOptions,
} = require('../../helpers');

import type { WithFixturesOptions, Fixtures } from '../../helpers';
import { METAMASK_STALELIST_URL } from '../phishing-controller/helpers';
import type { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import HomePage from '../../page-objects/pages/homepage';
import type { CompletedRequest, MockedEndpoint, Mockttp } from 'mockttp';

interface MockResponse {
  statusCode: number;
  body: string;
}

async function mockApis(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  return [
    await mockServer.forGet(METAMASK_STALELIST_URL).thenCallback((request: CompletedRequest): MockResponse => {
      return {
        statusCode: 200,
        body: JSON.stringify([{ fakedata: true }]),
      };
    }),
    await mockServer
      .forGet('https://token.api.cx.metamask.io/tokens/1')
      .thenCallback((request: CompletedRequest): MockResponse => {
        return {
          statusCode: 200,
          body: JSON.stringify([{ fakedata: true }]),
        };
      }),
    await mockServer
      .forGet('https://min-api.cryptocompare.com/data/price')
      .withQuery({ fsym: 'ETH', tsyms: 'USD' })
      .thenCallback((request: CompletedRequest): MockResponse => {
        return {
          statusCode: 200,
          body: JSON.stringify({
            fakedata: 0,
          }),
        };
      }),
  ];
}

describe('MetaMask onboarding @no-mmi', function () {
  it('should prevent network requests to basic functionality endpoints when the basic functionality toggle is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint }: Fixtures) => {
        try {
          await driver.navigate();
          await importSRPOnboardingFlow(
            driver,
            TEST_SEED_PHRASE,
            WALLET_PASSWORD,
          );

          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.check_pageIsLoaded();
          await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
          await onboardingCompletePage.navigateToDefaultPrivacySettings();

          const privacySettingsPage = new OnboardingPrivacySettingsPage(driver);
          await privacySettingsPage.toggleBasicFunctionalitySettings();
          await privacySettingsPage.toggleAssetsSettings();
          await privacySettingsPage.navigateBackToOnboardingCompletePage();

          await onboardingCompletePage.check_pageIsLoaded();
          await onboardingCompletePage.completeOnboarding();

          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.headerNavbar.switchToNetwork('mainnet');

          for (const endpoint of mockedEndpoint) {
            const requests = await endpoint.getSeenRequests();
            assert.equal(
              requests.length,
              0,
              'Network requests should not be made when basic functionality is disabled',
            );
          }
        } catch (e) {
          console.error('Error during basic functionality toggle test:', e);
          throw e;
        }
      },
    );
  });

  it('should not prevent network requests to basic functionality endpoints when the basic functionality toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint }: Fixtures) => {
        try {
          await driver.navigate();
          await importSRPOnboardingFlow(
            driver,
            TEST_SEED_PHRASE,
            WALLET_PASSWORD,
          );

          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.check_pageIsLoaded();
          await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
          await onboardingCompletePage.navigateToDefaultPrivacySettings();

          const privacySettingsPage = new OnboardingPrivacySettingsPage(driver);
          // Don't toggle settings - leave them on by default
          await privacySettingsPage.navigateBackToOnboardingCompletePage();

          await onboardingCompletePage.check_pageIsLoaded();
          await onboardingCompletePage.completeOnboarding();

          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.headerNavbar.switchToNetwork('mainnet');

          for (const endpoint of mockedEndpoint) {
            const requests = await endpoint.getSeenRequests();
            assert.equal(
              requests.length,
              1,
              'Network requests should be made when basic functionality is enabled',
            );
          }
        } catch (e) {
          console.error('Error during basic functionality test:', e);
          throw e;
        }
      },
    );
  });
});
