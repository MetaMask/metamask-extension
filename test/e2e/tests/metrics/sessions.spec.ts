import { MockttpServer } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import {
  expectMockRequest,
  expectNoMockRequest,
} from '../../helpers/mock-server';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

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
        fixtures: new FixtureBuilder()
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
        await loginWithBalanceValidation(driver);
        await expectMockRequest(driver, mockedEndpoint[0], { timeout: 3000 });
      },
    );
  });

  it('does not send session in UI if metrics disabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
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
        await loginWithBalanceValidation(driver);
        await expectNoMockRequest(driver, mockedEndpoint[0], { timeout: 3000 });
      },
    );
  });
});
