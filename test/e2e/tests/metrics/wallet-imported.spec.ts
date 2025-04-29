import { Browser } from 'selenium-webdriver';
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
            'Wallet Setup Selected',
            'Wallet Setup Complete',
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
        const expectedEvents =
          process.env.SELENIUM_BROWSER === Browser.FIREFOX ? 2 : 3;
        assert.equal(events.length, expectedEvents);

        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          // In Firefox, we expect 2 events in a specific order
          assert.deepStrictEqual(events[0].properties, {
            wallet_setup_type: 'import',
            new_wallet: false,
            category: 'Onboarding',
            locale: 'en',
            chain_id: '0x539',
            environment_type: 'fullscreen',
          });

          assert.deepStrictEqual(events[1].properties, {
            method: 'import',
            is_profile_syncing_enabled: true,
            hd_entropy_index: 0,
            category: 'Onboarding',
            locale: 'en',
            chain_id: '0x539',
            environment_type: 'fullscreen',
          });
        } else {
          // In other browsers, we expect 3 events
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
        }
      },
    );
  });
});
