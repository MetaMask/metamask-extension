const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  waitForAccountRendered,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Unlock wallet', function () {
  async function mockSegment(mockServer) {
    return await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({ batch: [{ type: 'page' }] })
      .times(3)
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      });
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

        let mockedRequests;
        await driver.wait(async () => {
          const isPending = await mockedEndpoint.isPending();
          mockedRequests = await mockedEndpoint.getSeenRequests();
          return isPending === false && mockedRequests.length === 3;
        }, 10000);

        assert.equal(mockedRequests.length, 3);
        const [firstMock, secondMock, thirdMock] = mockedRequests;
        assertBatchValue(firstMock, 'Home', '/');
        assertBatchValue(secondMock, 'Unlock Page', '/unlock');
        assertBatchValue(thirdMock, 'Home', '/');
      },
    );
  });
});

function assertBatchValue(mockRequest, assertedTitle, assertedPath) {
  const [mockJson] = mockRequest.body.json.batch;
  const { title, path } = mockJson.context.page;
  assert.equal(title, assertedTitle);
  assert.equal(path, assertedPath);
}
