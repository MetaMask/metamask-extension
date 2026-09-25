import { strict as assert } from 'assert';
import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import { E2E_DRIVER, MOCK_ANALYTICS_ID } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  getEventPayloads,
  isSidePanelEnabled,
  withFixtures,
} from '../../helpers';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';

/**
 * Mocks the segment API for the Empty Buy Banner Displayed event.
 *
 * @param mockServer - The mock server instance.
 * @returns The mocked endpoints
 */
async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Empty Buy Banner Displayed' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

pwTest.describe('Empty Buy Banner Displayed event', () => {
  pwTest(
    'is sent when the balance empty state is shown after onboarding',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withMetaMetricsController({
              analyticsId: MOCK_ANALYTICS_ID,
              consentDecisionMade: true,
              optedIn: true,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSegment,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await completeCreateNewWalletOnboardingFlow({
            driver,
            consentDecisionMade: true,
            optedIn: true,
          });

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkBalanceEmptyStateIsDisplayed();

          const events = await getEventPayloads(driver, mockedEndpoints);
          // On Chrome with sidepanel enabled, both sidepanel.html and home.html
          // render BalanceEmptyState after onboarding, so we may receive 1 or 2
          // events depending on timing (one per window, each with a different
          // environment_type: 'sidepanel' or 'fullscreen').
          assert.ok(events.length >= 1, 'Expected at least one event');
          assert.equal(events[0].event, 'Empty Buy Banner Displayed');

          const sidePanelEnabled = await isSidePanelEnabled();
          const {
            profile_id: _profileId,
            canonical_profile_id: _canonicalProfileId,
            environment_type: actualEnvironmentType,
            ...restEventProperties
          } = events[0].properties;

          assert.deepStrictEqual(restEventProperties, {
            category: 'Navigation',
            locale: 'en',
            referrer: 'metamask',
            location: 'balance_empty_state',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          });

          if (sidePanelEnabled) {
            assert.ok(
              actualEnvironmentType === 'sidepanel' ||
                actualEnvironmentType === 'fullscreen',
              `Expected environment_type to be 'sidepanel' or 'fullscreen' ` +
                `when sidepanel is enabled (both windows fire the event), ` +
                `but got '${actualEnvironmentType}'`,
            );
          } else {
            assert.equal(actualEnvironmentType, 'fullscreen');
          }
        },
      );
    },
  );
});
