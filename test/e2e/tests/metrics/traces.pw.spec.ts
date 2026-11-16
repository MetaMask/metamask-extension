import { test as pwTest } from '@playwright/test';
import { MockttpServer } from 'mockttp';
import { E2E_DRIVER } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import {
  expectMockRequest,
  expectNoMockRequest,
} from '../../helpers/mock-server';
import { login } from '../../page-objects/flows/login.flow';

async function mockSentryCustomTrace(mockServer: MockttpServer) {
  return [
    await mockServer
      .forPost(/sentry/u)
      .withBodyIncluding('"transaction":"UI Startup"')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      }),
  ];
}

// Temporary diagnostic: log each Sentry envelope's items and arrival time.
const logEnvelope = async (label: string, body: string) => {
  const items = [...body.matchAll(/"type":"(\w+)"/gu)].map((m) => m[1]);
  const names = [...body.matchAll(/"transaction":"([^"]+)"/gu)].map((m) => m[1]);
  const finish = body.match(/"sentry\.idle_span_finish_reason":"(\w+)"/u)?.[1];
  console.log(
    `[envelope-diag] ${new Date().toISOString()} ${label} items=${items.join(',')} transactions=${names.join(',')} finish=${finish ?? '-'}`,
  );
};

async function mockSentryAutomatedTrace(mockServer: MockttpServer) {
  return [
    await mockServer
      .forPost(/sentry/u)
      .withBodyIncluding('"transaction":"/home.html"')
      .thenCallback(async (request) => {
        await logEnvelope('match', (await request.body.getText()) ?? '');
        return {
          statusCode: 200,
          json: {},
        };
      }),
    await mockServer
      .forPost(/sentry/u)
      .thenCallback(async (request) => {
        await logEnvelope('other', (await request.body.getText()) ?? '');
        return {
          statusCode: 200,
          json: {},
        };
      }),
  ];
}

pwTest.describe('Traces', () => {
  pwTest('sends custom trace when opening UI if metrics enabled', async () => {
    await withFixtures(
      {
        driverType: E2E_DRIVER.PLAYWRIGHT,
        fixtures: new FixtureBuilderV2()
          .withAnalyticsController({
            consentDecisionMade: true,
            optedIn: true,
          })
          .build(),
        title: pwTest.info().titlePath.join(' '),
        testSpecificMock: mockSentryCustomTrace,
        manifestFlags: {
          sentry: { forceEnable: false },
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await login(driver);
        await expectMockRequest(driver, mockedEndpoint[0], { timeout: 3000 });
      },
    );
  });

  pwTest(
    'does not send custom trace when opening UI if metrics disabled',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2()
            .withAnalyticsController({
              consentDecisionMade: true,
              optedIn: false,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSentryCustomTrace,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          await login(driver);
          await expectNoMockRequest(driver, mockedEndpoint[0], {
            timeout: 3000,
          });
        },
      );
    },
  );

  pwTest(
    'sends automated trace when opening UI if metrics enabled',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2()
            .withAnalyticsController({
              consentDecisionMade: true,
              optedIn: true,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSentryAutomatedTrace,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          await login(driver);
          console.log(`[envelope-diag] ${new Date().toISOString()} wait-start`);
          await expectMockRequest(driver, mockedEndpoint[0], { timeout: 20000 });
        },
      );
    },
  );

  pwTest(
    'does not send automated trace when opening UI if metrics disabled',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2()
            .withAnalyticsController({
              consentDecisionMade: true,
              optedIn: false,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSentryAutomatedTrace,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          await login(driver);
          await expectNoMockRequest(driver, mockedEndpoint[0], {
            timeout: 3000,
          });
        },
      );
    },
  );
});
