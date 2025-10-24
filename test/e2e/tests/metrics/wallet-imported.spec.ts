import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { mockSegment } from './mocks/segment';

describe('Wallet Created Events - Imported Account', function () {
  it('are sent when onboarding user who chooses to opt in metrics', async function () {
    // We need to distinguish between browsers, because routes differ (MetaMetrics screen)
    const eventsChrome = [
      'App Opened',
      'App Installed',
      'App Installed',
      'SRP Backup Confirmed',
      'Wallet Import Attempted',
      'Wallet Imported',
      'Wallet Setup Completed',
    ];

    const eventsFirefox = [
      'App Opened',
      'App Installed',
      'App Installed',
      'App Installed',
      'Analytics Preference Selected',
      'Wallet Import Started',
      'SRP Backup Confirmed',
      'Wallet Import Attempted',
      'Wallet Imported',
      'Wallet Setup Completed',
    ];
    const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;
    const expectedEvents = isFirefox ? eventsFirefox : eventsChrome;

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          return await mockSegment(server, expectedEvents);
        },
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeImportSRPOnboardingFlow({
          driver,
          participateInMetaMetrics: true,
        });

        const events = await getEventPayloads(driver, mockedEndpoints);

        // Only include track events not identify events
        const trackEvents = events.filter(
          (e: { type?: string }) => e.type === 'track',
        );

        const eventTypes = trackEvents.map(
          (event: { event: string }) => event.event,
        );
        expectedEvents.forEach((expectedEvent) => {
          assert(
            eventTypes.includes(expectedEvent),
            `Expected event type '${expectedEvent}' not found in events: ${eventTypes.join(', ')}`,
          );
        });

        assert.equal(trackEvents.length, expectedEvents.length);

        const getNthEventByName = (
          name: string,
          n: number,
        ): { event: string; properties: Record<string, unknown> } => {
          const matches = trackEvents.filter(
            (e: { event: string }) => e.event === name,
          );
          const found = matches[n - 1];
          if (!found) {
            throw new Error(
              `Expected to find ${n} occurrence(s) of event '${name}', but found ${matches.length}. Available events: ${trackEvents
                .map((e: { event: string }) => e.event)
                .join(', ')}`,
            );
          }
          return found;
        };

        const firstEvent = getNthEventByName('App Opened', 1);
        const secondEvent = getNthEventByName('App Installed', 1);
        const thirdEvent = getNthEventByName('App Installed', 2);
        const fourthEvent = isFirefox
          ? getNthEventByName('App Installed', 3)
          : getNthEventByName('SRP Backup Confirmed', 1);
        const fifthEvent = isFirefox
          ? getNthEventByName('Analytics Preference Selected', 1)
          : getNthEventByName('Wallet Import Attempted', 1);

        assert.deepStrictEqual(firstEvent.properties, {
          category: 'App',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'background',
        });

        assert.deepStrictEqual(secondEvent.properties, {
          category: 'App',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'background',
        });

        assert.deepStrictEqual(thirdEvent.properties, {
          category: 'App',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'background',
        });

        if (isFirefox) {
          assert.deepStrictEqual(fourthEvent.properties, {
            category: 'Onboarding',
            locale: 'en',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            environment_type: 'fullscreen',
          });
        } else {
          assert.deepStrictEqual(fourthEvent.properties, {
            category: 'Onboarding',
            locale: 'en',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            environment_type: 'fullscreen',
          });
        }

        if (isFirefox) {
          assert.deepStrictEqual(fifthEvent.properties, {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_metrics_opted_in: true,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            has_marketing_consent: false,
            location: 'onboarding_metametrics',
            category: 'Onboarding',
            locale: 'en',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            environment_type: 'fullscreen',
          });
        } else {
          assert.deepStrictEqual(fifthEvent.properties, {
            category: 'Onboarding',
            locale: 'en',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            environment_type: 'fullscreen',
          });
        }

        assert.deepStrictEqual(fourthEvent.properties, {
          category: 'Onboarding',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'fullscreen',
        });
      },
    );
  });
});
