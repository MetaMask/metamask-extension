import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { MOCK_META_METRICS_ID } from '../../constants';

/**
 * Mocks the segment API multiple times for specific payloads that we expect to
 * see when these tests are run. In this case, we are looking for
 * 'Permissions Requested' and 'Permissions Received'. Do not use the constants
 * from the metrics constants files, because if these change we want a strong
 * indicator to our data team that the shape of data will change.
 *
 * @param mockServer - The mock server instance.
 * @returns
 */
async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Wallet Setup Started' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Wallet Created' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'nft_autodetection_enabled' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Nft detection event', function () {
  it('is sent when onboarding user', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .withPreferencesController({
            useTokenDetection: true,
            useNftDetection: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: true,
        });
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 2);
        assert.deepStrictEqual(events[0].properties, {
          account_type: 'metamask',
          category: 'Onboarding',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'fullscreen',
        });
        assert.deepStrictEqual(events[1].properties, {
          method: 'create',
          category: 'Onboarding',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'fullscreen',
          is_profile_syncing_enabled: true,
          hd_entropy_index: 0,
        });
      },
    );
  });
});
