const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  WALLET_PASSWORD,
  onboardingBeginCreateNewWallet,
  onboardingChooseMetametricsOption,
  onboardingCreatePassword,
  onboardingRevealAndConfirmSRP,
  onboardingCompleteWalletCreation,
  onboardingPinExtension,
  getEventPayloads,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

/**
 * mocks the segment api multiple times for specific payloads that we expect to
 * see when these tests are run. In this case we are looking for
 * 'Permissions Requested' and 'Permissions Received'. Do not use the constants
 * from the metrics constants files, because if these change we want a strong
 * indicator to our data team that the shape of data will change.
 *
 * @param {import('mockttp').Mockttp} mockServer
 * @returns {Promise<import('mockttp/dist/pluggable-admin').MockttpClientResponse>[]}
 */
async function mockSegment(mockServer) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Wallet Setup Selected' }],
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

describe('Nft detection event @no-mmi', function () {
  it('is sent when onboarding user', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .withPreferencesController({
            useTokenDetection: true,
            useNftDetection: true,
          })
          .build(),
        defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();

        await onboardingBeginCreateNewWallet(driver);
        await onboardingChooseMetametricsOption(driver, true);
        await onboardingCreatePassword(driver, WALLET_PASSWORD);
        await onboardingRevealAndConfirmSRP(driver);
        await onboardingCompleteWalletCreation(driver);
        await onboardingPinExtension(driver);

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 3);
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
          is_profile_syncing_enabled: null,
        });
        assert.deepStrictEqual(events[2].properties, {
          nft_autodetection_enabled: true,
          category: 'Onboarding',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });
});
