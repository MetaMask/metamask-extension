import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { MOCK_META_METRICS_ID } from '../../constants';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

type PageEvent = {
  timestamp: string;
  context: {
    page: {
      title: string;
      path: string;
    };
  };
};

describe('Unlock wallet', function (this: Suite) {
  async function mockSegment(mockServer: Mockttp) {
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
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint }) => {
        await loginWithBalanceValidation(driver);
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

function sortEventsByTime(events: PageEvent[]): PageEvent[] {
  events.sort((event1, event2) => {
    const timestamp1 = new Date(event1.timestamp).getTime();
    const timestamp2 = new Date(event2.timestamp).getTime();
    // Compare timestamps, return -1 for earlier, 1 for later, 0 for equal
    return timestamp1 - timestamp2;
  });
  return events;
}

function assertBatchValue(
  event: PageEvent,
  assertedTitle: string,
  assertedPath: string,
): void {
  const { title, path } = event.context.page;
  assert.equal(title, assertedTitle);
  assert.equal(path, assertedPath);
}
