import { strict as assert } from 'assert';
import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { MOCK_ANALYTICS_ID, E2E_DRIVER } from '../../constants';
import { createNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';

/**
 * Mocks the Segment track for 'App Installed'. Event-name constants are
 * intentionally omitted so a rename in source fails these tests instead of
 * silently tracking a new payload shape.
 *
 * @param mockServer - The mock server instance.
 * @returns The mocked endpoints.
 */
async function mockAppInstalled(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'App Installed',
            properties: {
              category: 'App',
            },
          },
        ],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

pwTest.describe('App Installed Events', () => {
  pwTest(
    'are sent immediately when user installs app and chooses to opt in metrics',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withMetaMetricsController({
              analyticsId: MOCK_ANALYTICS_ID,
              consentDecisionMade: true,
              optedIn: true,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockAppInstalled,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await createNewWalletOnboardingFlow({
            driver,
            optedIn: true,
          });

          const events = await getEventPayloads(driver, mockedEndpoints);
          assert.equal(events.length, 1);
          assert.deepStrictEqual(events[0].properties, {
            category: 'App',
            locale: 'en',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            environment_type: 'background',
          });
        },
      );
    },
  );

  pwTest(
    'are not sent when user installs app and chooses to opt out metrics',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withMetaMetricsController({
              analyticsId: MOCK_ANALYTICS_ID,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockAppInstalled,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await createNewWalletOnboardingFlow({
            driver,
            optedIn: false,
          });

          const mockedRequests = await getEventPayloads(
            driver,
            mockedEndpoints,
            false,
          );
          assert.equal(mockedRequests.length, 0);
        },
      );
    },
  );
});
