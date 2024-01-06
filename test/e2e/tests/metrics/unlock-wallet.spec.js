const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  waitForAccountRendered,
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
      async ({ driver, mockedEndpoint }) => {
        await unlockWallet(driver);
        await waitForAccountRendered(driver);
        const events = await getEventPayloads(driver, mockedEndpoint);
        assert.equal(events.length, 3);
        assertBatchValue(events[0], 'Home', '/');
        assertBatchValue(events[1], 'Unlock Page', '/unlock');
        assertBatchValue(events[2], 'Home', '/');
      },
    );
  });
});

function assertBatchValue(event, assertedTitle, assertedPath) {
  const { title, path } = event.context.page;
  assert.equal(title, assertedTitle);
  assert.equal(path, assertedPath);
}
