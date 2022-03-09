const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Segment metrics', function () {
  async function mockSegment(mockServer) {
    mockServer.reset();
    await mockServer.forAnyRequest().thenPassThrough();
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
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should send first three Page metric events upon fullscreen page load', async function () {
    await withFixtures(
      {
        fixtures: 'metrics-enabled',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver, mockServer }) => {
        const mockedEndpoints = await mockSegment(mockServer);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.wait(async () => {
          const isPending = await mockedEndpoints.isPending();
          return isPending === false;
        }, 10000);
        const mockedRequests = await mockedEndpoints.getSeenRequests();
        assert.equal(mockedRequests.length, 3);
        const firstMock = mockedRequests[0];
        assert.equal(firstMock.body.json.batch[0].context.page.title, 'Home');
        assert.equal(firstMock.body.json.batch[0].context.page.path, '/');
        const secondMock = mockedRequests[1];
        assert.equal(
          secondMock.body.json.batch[0].context.page.title,
          'Unlock Page',
        );
        assert.equal(
          secondMock.body.json.batch[0].context.page.path,
          '/unlock',
        );
        const thirdMock = mockedRequests[2];
        assert.equal(thirdMock.body.json.batch[0].context.page.title, 'Home');
        assert.equal(thirdMock.body.json.batch[0].context.page.path, '/');
      },
    );
  });
});
