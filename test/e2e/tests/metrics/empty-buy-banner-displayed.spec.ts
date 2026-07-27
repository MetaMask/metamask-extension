import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import {
  getEventPayloads,
  isSidePanelEnabled,
  withFixtures,
} from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { MOCK_ANALYTICS_ID } from '../../constants';

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

describe('Empty Buy Banner Displayed event', function () {
  it('is sent when the balance empty state is shown after onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          completedMetaMetricsOnboarding: true,
          optedIn: true,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkBalanceEmptyStateIsDisplayed();

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.equal(events[0].event, 'Empty Buy Banner Displayed');

        const expectedEnvironmentType = (await isSidePanelEnabled())
          ? 'sidepanel'
          : 'fullscreen';
        const {
          profile_id: _profileId,
          canonical_profile_id: _canonicalProfileId,
          ...eventProperties
        } = events[0].properties;

        assert.deepStrictEqual(eventProperties, {
          category: 'Navigation',
          locale: 'en',
          referrer: 'metamask',
          location: 'balance_empty_state',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: expectedEnvironmentType,
        });
      },
    );
  });
});
