import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { MOCK_ANALYTICS_ID } from '../../constants';
import { mockSegment } from './mocks/segment';

const WALLET_SETUP_STARTED_EVENT = 'Wallet Setup Started';

describe('Wallet Setup Started event', function () {
  it('is sent when the user selects create wallet with SRP during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          return await mockSegment(server, [WALLET_SETUP_STARTED_EVENT]);
        },
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          completedMetaMetricsOnboarding: true,
          optedIn: true,
        });

        const events = await getEventPayloads(driver, mockedEndpoints);
        const trackEvents = events.filter(
          (event: {
            type?: string;
            event?: string;
            properties?: Record<string, unknown>;
          }) =>
            event.type === 'track' &&
            event.event === WALLET_SETUP_STARTED_EVENT,
        );

        assert.equal(trackEvents.length, 1);
        assert.deepStrictEqual(trackEvents[0].properties, {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'metamask',
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
