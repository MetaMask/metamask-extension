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

async function mockSentrySession(mockServer: MockttpServer) {
  return [
    await mockServer
      .forPost(/sentry/u)
      .withBodyIncluding('"type":"session"')
      .withBodyIncluding('"status":"exited"')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      }),
  ];
}

pwTest.describe('Sessions', () => {
  pwTest('sends session in UI if metrics enabled', async () => {
    await withFixtures(
      {
        driverType: E2E_DRIVER.PLAYWRIGHT,
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            consentDecisionMade: true,
            optedIn: true,
          })
          .build(),
        title: pwTest.info().titlePath.join(' '),
        testSpecificMock: mockSentrySession,
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

  pwTest('does not send session in UI if metrics disabled', async () => {
    await withFixtures(
      {
        driverType: E2E_DRIVER.PLAYWRIGHT,
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            consentDecisionMade: true,
            optedIn: false,
          })
          .build(),
        title: pwTest.info().titlePath.join(' '),
        testSpecificMock: mockSentrySession,
        manifestFlags: {
          sentry: { forceEnable: false },
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await login(driver);
        await expectNoMockRequest(driver, mockedEndpoint[0], { timeout: 3000 });
      },
    );
  });
});
