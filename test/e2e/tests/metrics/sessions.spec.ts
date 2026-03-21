import { MockttpServer } from 'mockttp';
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

describe('Sessions', function () {
  it('sends session in UI if metrics enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
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

  it('does not send session in UI if metrics disabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            participateInMetaMetrics: false,
          })
          .build(),
        title: this.test?.fullTitle(),
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
