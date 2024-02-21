const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  onboardingBeginCreateNewWallet,
  onboardingChooseMetametricsOption,
  getEventPayloads,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

/**
 * mocks the segment api multiple times for specific payloads that we expect to
 * see when these tests are run. In this case we are looking for
 * 'App Installed'. Do not use the constants from the metrics constants files,
 * because if these change we want a strong indicator to our data team that the
 * shape of data will change.
 *
 * @param {import('mockttp').Mockttp} mockServer
 * @returns {Promise<import('mockttp/dist/pluggable-admin').MockttpClientResponse>[]}
 */
async function mockSegment(mockServer) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'App Installed' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('App Installed Events @no-mmi', function () {
  it('are sent immediately when user installs app and chooses to opt in metrics', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();

        await onboardingBeginCreateNewWallet(driver);
        await onboardingChooseMetametricsOption(driver, true);

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.deepStrictEqual(events[0].properties, {
          category: 'App',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('are not sent when user installs app and chooses to opt out metrics', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
          })
          .build(),
        defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await onboardingBeginCreateNewWallet(driver);
        await onboardingChooseMetametricsOption(driver, false);

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
