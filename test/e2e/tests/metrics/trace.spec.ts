import { MockttpServer } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { expectMockRequest, expectNoMockRequest } from '../../../helpers/mock-server';

async function mockSentryCustomTrace(mockServer: MockttpServer) {
  return await mockServer
    .forPost(/sentry/)
    .withBodyIncluding('"transaction":"UI Startup"')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });
}

async function mockSentryAutomatedTrace(mockServer: MockttpServer) {
  return await mockServer
    .forPost(/sentry/)
    .withBodyIncluding('"transaction":"/home.html"')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });
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
          doNotForceSentryForThisTest: true,
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await unlockWallet(driver);
        await expectMockRequest(driver, mockedEndpoint, { timeout: 3000 });
      },
    );
  });

  it('does not sends custom trace when opening UI if metrics disabled', async function () {
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
          doNotForceSentryForThisTest: true,
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await unlockWallet(driver);
        await expectNoMockRequest(driver, mockedEndpoint, { timeout: 3000 });
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
          doNotForceSentryForThisTest: true,
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await unlockWallet(driver);
        await expectMockRequest(driver, mockedEndpoint, { timeout: 3000 });
      },
    );
  });

  it('does not send automated trace when opening UI if metrics disabled', async function () {
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
          doNotForceSentryForThisTest: true,
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await unlockWallet(driver);
        await expectNoMockRequest(driver, mockedEndpoint, { timeout: 3000 });
      },
    );
  });
});
