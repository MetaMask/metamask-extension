import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { mockSegment } from './mocks/segment';

describe('Wallet Created Events - Imported Account', function () {
  it('are sent when onboarding user who chooses to opt in metrics', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          return await mockSegment(server, [
            'Wallet Import Started',
            'Wallet Setup Completed',
            'Wallet Created',
          ]);
        },
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeImportSRPOnboardingFlow({
          driver,
          participateInMetaMetrics: true,
        });

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 3);

        assert.deepStrictEqual(events[0].properties, {
          account_type: 'imported',
          category: 'Onboarding',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'fullscreen',
        });

        assert.deepStrictEqual(events[1].properties, {
          wallet_setup_type: 'import',
          new_wallet: false,
          account_type: 'imported',
          category: 'Onboarding',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'fullscreen',
        });

        assert.deepStrictEqual(events[2].properties, {
          method: 'import',
          is_profile_syncing_enabled: true,
          category: 'Onboarding',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'fullscreen',
          hd_entropy_index: 0,
        });
      },
    );
  });
});
