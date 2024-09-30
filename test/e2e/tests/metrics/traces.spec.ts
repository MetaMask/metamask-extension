import { MockttpServer } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import {
  expectMockRequest,
  expectNoMockRequest,
} from '../../helpers/mock-server';

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

async function mockSentryAutomatedTrace(mockServer: MockttpServer) {
  return [
    await mockServer
      .forPost(/sentry/u)
      .withBodyIncluding('"transaction":"/home.html"')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      }),
  ];
}

describe('Traces', function () {
  it('sends custom trace when opening UI if metrics enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSentryCustomTrace,
        manifestFlags: {
          sentry: { doNotForceForThisTest: true },
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await unlockWallet(driver);
        await expectMockRequest(driver, mockedEndpoint[0], { timeout: 3000 });
      },
    );
  });

  it('does not send custom trace when opening UI if metrics disabled @no-mmi', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            participateInMetaMetrics: false,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSentryCustomTrace,
        manifestFlags: {
          sentry: { doNotForceForThisTest: true },
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await unlockWallet(driver);
        await expectNoMockRequest(driver, mockedEndpoint[0], { timeout: 3000 });
      },
    );
  });

  it('sends automated trace when opening UI if metrics enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSentryAutomatedTrace,
        manifestFlags: {
          sentry: { doNotForceForThisTest: true },
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await unlockWallet(driver);
        await expectMockRequest(driver, mockedEndpoint[0], { timeout: 3000 });
      },
    );
  });

  it('does not send automated trace when opening UI if metrics disabled @no-mmi', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            participateInMetaMetrics: false,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSentryAutomatedTrace,
        manifestFlags: {
          sentry: { doNotForceForThisTest: true },
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await unlockWallet(driver);
        await expectNoMockRequest(driver, mockedEndpoint[0], { timeout: 3000 });
      },
    );
  });
});
