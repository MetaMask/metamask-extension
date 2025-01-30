const { strict: assert } = require('assert');
const {
  withFixtures,
  logInWithBalanceValidation,
  defaultGanacheOptions,
  getEventPayloads,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Unlock wallet', function () {
  async function mockSegment(mockServer) {
    return [
      await mockServer
        .forPost('https://api.segment.io/v1/batch')
        .withJsonBodyIncluding({ batch: [{ type: 'page' }] })
        .times(3)
        .thenCallback(() => {
          return {
            statusCode: 200,
          };
        }),
    ];
  }

  it('should send first three Page metric events upon fullscreen page load', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        const events = await getEventPayloads(driver, mockedEndpoint);
        const sortedEvents = sortEventsByTime(events);
        await assert.equal(sortedEvents.length, 3);
        assertBatchValue(sortedEvents[0], 'Home', '/');
        assertBatchValue(sortedEvents[1], 'Unlock Page', '/unlock');
        assertBatchValue(sortedEvents[2], 'Home', '/');
      },
    );
  });
});

function sortEventsByTime(events) {
  events.sort((event1, event2) => {
    const timestamp1 = new Date(event1.timestamp);
    const timestamp2 = new Date(event2.timestamp);
    // Compare timestamps, return -1 for earlier, 1 for later, 0 for equal
    return timestamp1 - timestamp2;
  });
  return events;
}

function assertBatchValue(event, assertedTitle, assertedPath) {
  const { title, path } = event.context.page;
  assert.equal(title, assertedTitle);
  assert.equal(path, assertedPath);
}
