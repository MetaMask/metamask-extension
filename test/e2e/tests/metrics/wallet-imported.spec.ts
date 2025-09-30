import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { mockSegment } from './mocks/segment';

describe('Wallet Created Events - Imported Account', function () {
  it('are sent when onboarding user who chooses to opt in metrics', async function () {
    const eventsToMock = [
      'App Opened',
      'Wallet Imported',
      'Wallet Setup Completed',
    ];
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          return await mockSegment(server, eventsToMock);
        },
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeImportSRPOnboardingFlow({
          driver,
          participateInMetaMetrics: true,
        });

        const events = await getEventPayloads(driver, mockedEndpoints);

        const eventTypes = events.map(
          (event: { event: string }) => event.event,
        );
        eventsToMock.forEach((expectedEvent) => {
          assert(
            eventTypes.includes(expectedEvent),
            `Expected event type '${expectedEvent}' not found in events: ${eventTypes.join(', ')}`,
          );
        });

        assert.equal(events.length, eventsToMock.length);

        const firstEvent = events.find(
          (e: { event: string }) => e.event === eventsToMock[0],
        );
        const secondEvent = events.find(
          (e: { event: string }) => e.event === eventsToMock[1],
        );
        const thirdEvent = events.find(
          (e: { event: string }) => e.event === eventsToMock[2],
        );

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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          biometrics_enabled: false,
          category: 'Onboarding',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'fullscreen',
        });

        assert.deepStrictEqual(thirdEvent.properties, {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          wallet_setup_type: 'import',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_wallet: false,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'imported',
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
