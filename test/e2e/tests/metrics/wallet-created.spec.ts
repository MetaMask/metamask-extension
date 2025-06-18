import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
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
        batch: [{ type: 'track', event: 'Analytics Preference Selected' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Wallet Creation Attempted' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'SRP Backup Selected' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'SRP Revealed' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'SRP Backup Confirm Display' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'SRP Backup Confirmed' }],
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
        batch: [{ type: 'track', event: 'Wallet Setup Completed' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Wallet Created Events', function () {
  it('are sent when onboarding user who chooses to opt in metrics', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
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
        assert.equal(events.length, 9);
        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          assert.deepStrictEqual(events[0].properties, {
            account_type: 'metamask',
            category: 'Onboarding',
            locale: 'en',
            chain_id: '0x539',
            environment_type: 'fullscreen',
          });
        }
        assert.deepStrictEqual(events[1].properties, {
          category: 'Onboarding',
          chain_id: '0x539',
          environment_type: 'fullscreen',
          has_marketing_consent: false,
          is_metrics_opted_in: true,
          locale: 'en',
          location: 'onboarding_metametrics',
        });
        assert.deepStrictEqual(events[2].properties, {
          account_type: 'metamask',
          category: 'Onboarding',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'fullscreen',
        });
        assert.ok(
          events[3].properties.category === 'Onboarding' &&
            events[3].properties.chain_id === '0x539' &&
            events[3].properties.environment_type === 'fullscreen' &&
            events[3].properties.locale === 'en' &&
            (events[3].properties.hd_entropy_index === 0 ||
              events[3].properties.hd_entropy_index === undefined),
        );
        assert.ok(
          events[4].properties.category === 'Onboarding' &&
            events[4].properties.chain_id === '0x539' &&
            events[4].properties.environment_type === 'fullscreen' &&
            events[4].properties.locale === 'en' &&
            (events[4].properties.hd_entropy_index === 0 ||
              events[4].properties.hd_entropy_index === undefined),
        );
        assert.ok(
          events[5].properties.category === 'Onboarding' &&
            events[5].properties.chain_id === '0x539' &&
            events[5].properties.environment_type === 'fullscreen' &&
            events[5].properties.locale === 'en' &&
            (events[5].properties.hd_entropy_index === 0 ||
              events[5].properties.hd_entropy_index === undefined),
        );
        assert.deepStrictEqual(events[6].properties, {
          category: 'Onboarding',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'fullscreen',
          hd_entropy_index: 0,
        });
        assert.deepStrictEqual(events[7].properties, {
          method: 'create',
          category: 'Onboarding',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'fullscreen',
          is_profile_syncing_enabled: true,
          hd_entropy_index: 0,
        });
        assert.deepStrictEqual(events[8].properties, {
          account_type: 'metamask',
          category: 'Onboarding',
          chain_id: '0x539',
          environment_type: 'fullscreen',
          locale: 'en',
          new_wallet: true,
          wallet_setup_type: 'new',
        });
      },
    );
  });

  it('are not sent when onboarding user who chooses to opt out metrics', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
        });
        const mockedRequests = await getEventPayloads(
          driver,
          mockedEndpoints,
          false,
        );
        assert.equal(mockedRequests.length, 0);
      },
    );
  });
});
