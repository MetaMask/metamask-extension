import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { Mockttp } from 'mockttp';
import {
  getEventPayloads,
  withFixtures,
  assertInAnyOrder,
} from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
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

        const appInstallBackground = [
          [
            (req: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              properties: {
                category: string;
                locale: string;
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id: string;
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                environment_type: string;
              };
            }) =>
              req.properties.category === 'App' &&
              req.properties.locale === 'en' &&
              req.properties.chain_id === '0x1' &&
              req.properties.environment_type === 'background',
          ],
        ];
        assertInAnyOrder(trackEvents, appInstallBackground);

        const appInstallFullscreen = [
          [
            (req: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              properties: {
                category: string;
                locale: string;
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id: string;
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                environment_type: string;
              };
            }) =>
              req.properties.category === 'App' &&
              req.properties.locale === 'en' &&
              req.properties.chain_id === '0x1' &&
              req.properties.environment_type === 'fullscreen',
          ],
        ];
        assertInAnyOrder(trackEvents, appInstallFullscreen);

        // Assert SRP Backup Confirmed or App Installed event (depending on browser)
        const fourthEventAssertion = [
          [
            (req: {
              properties: {
                category: string;
                locale: string;
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id: string;
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                environment_type: string;
              };
            }) =>
              req.properties.category === 'Onboarding' &&
              req.properties.locale === 'en' &&
              req.properties.chain_id === '0x1' &&
              req.properties.environment_type === 'fullscreen',
          ],
        ];
        assertInAnyOrder(trackEvents, fourthEventAssertion);

        if (isFirefox) {
          // Assert Analytics Preference Selected event
          const analyticsPreferenceAssertion = [
            [
              (req: {
                properties: {
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  is_metrics_opted_in: boolean;
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  has_marketing_consent: boolean;
                  location: string;
                  category: string;
                  locale: string;
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  chain_id: string;
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  environment_type: string;
                };
              }) =>
                req.properties.is_metrics_opted_in === true &&
                req.properties.has_marketing_consent === false &&
                req.properties.location === 'onboarding_metametrics' &&
                req.properties.category === 'Onboarding' &&
                req.properties.locale === 'en' &&
                req.properties.chain_id === '0x1' &&
                req.properties.environment_type === 'fullscreen',
            ],
          ];
          assertInAnyOrder(trackEvents, analyticsPreferenceAssertion);
        } else {
          // Assert Wallet Import Attempted event
          const walletImportAttemptedAssertion = [
            [
              (req: {
                properties: {
                  category: string;
                  locale: string;
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  chain_id: string;
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  environment_type: string;
                };
              }) =>
                req.properties.category === 'Onboarding' &&
                req.properties.locale === 'en' &&
                req.properties.chain_id === '0x1' &&
                req.properties.environment_type === 'fullscreen',
            ],
          ];
          assertInAnyOrder(trackEvents, walletImportAttemptedAssertion);
        }
      },
    );
  });
});
