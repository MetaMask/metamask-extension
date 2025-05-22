import { strict as assert } from 'assert';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { MOCK_META_METRICS_ID } from '../../constants';

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
        segmentVerification: {
          events: [
            {
              event: 'Wallet Setup Selected',
              properties: {
                category: 'Onboarding',
                locale: 'en',
                chain_id: '0x539',
                environment_type: 'fullscreen',
              },
              firefoxOnly: true,
            },
            {
              event: 'Analytics Preference Selected',
              properties: {
                category: 'Onboarding',
                chain_id: '0x539',
                environment_type: 'fullscreen',
                has_marketing_consent: false,
                is_metrics_opted_in: true,
                locale: 'en',
                location: 'onboarding_metametrics',
              },
            },
            {
              event: 'Wallet Password Created',
              properties: {
                category: 'Onboarding',
                locale: 'en',
                chain_id: '0x539',
                environment_type: 'fullscreen',
              },
            },
            {
              event: 'SRP Backup Selected',
              properties: {
                category: 'Onboarding',
                locale: 'en',
                chain_id: '0x539',
                environment_type: 'fullscreen',
                hd_entropy_index: 0 || undefined,
              },
            },
            {
              event: 'SRP Revealed',
              properties: {
                category: 'Onboarding',
                locale: 'en',
                chain_id: '0x539',
                environment_type: 'fullscreen',
                hd_entropy_index: 0 || undefined,
              },
            },
            {
              event: 'SRP Backup Confirm Display',
              properties: {
                category: 'Onboarding',
                locale: 'en',
                chain_id: '0x539',
                environment_type: 'fullscreen',
              },
            },
            {
              event: 'SRP Backup Confirmed',
              properties: {
                category: 'Onboarding',
                locale: 'en',
                chain_id: '0x539',
                environment_type: 'fullscreen',
                hd_entropy_index: 0,
              },
            },
            {
              event: 'Wallet Created',
              properties: {
                category: 'Onboarding',
                locale: 'en',
                chain_id: '0x539',
                environment_type: 'fullscreen',
                hd_entropy_index: 0,
              },
            },
            {
              event: 'Wallet Setup Complete',
              properties: {
                category: 'Onboarding',
                locale: 'en',
                chain_id: '0x539',
                environment_type: 'fullscreen',
                new_wallet: true,
                wallet_setup_type: 'new',
              },
            },
          ],
        },
      },
      async ({ driver }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: true,
        });
      },
    );
  });

  it.skip('are not sent when onboarding user who chooses to opt out metrics', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: [],
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
