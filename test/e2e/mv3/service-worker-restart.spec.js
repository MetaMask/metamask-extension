const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const PRIVATE_KEY =
  '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC';
const generateETHBalance = (eth) => convertToHexValue(eth * 10 ** 18);
const defaultGanacheOptions = {
  accounts: [{ secretKey: PRIVATE_KEY, balance: generateETHBalance(25) }],
};
// dapp test
// test/e2e/tests/metrics.spec.js
describe('MV3 - Service worker restart', function () {
  let windowHandles;

  async function mockSegment(mockServer) {
    mockServer.reset();
    await mockServer.forAnyRequest().thenPassThrough();
    return await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({ batch: [{ type: 'page' }] })
      .times(1)
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      });
  }

  it('should continue to support dapp interactions after service worker re-start', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
        failOnConsoleError: false, // because of segment
      },
      async ({ driver, mockServer }) => {
        const mockedEndpoints = await mockSegment(mockServer);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Terminate Service Worker
        await driver.openNewPage('chrome://inspect/#service-workers/');
        await driver.clickElement({
          text: 'Service workers',
          tag: 'button',
        });

        await driver.clickElement({
          text: 'terminate',
          tag: 'span',
        });

        // Switch back to extension`
        windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindow(extension);

        // hit the menu button
        // await driver.clickElement(
        //   '[data-testid="account-options-menu-button"]',
        // );

        // assert that the segment request has been sent through inspecting the mock
        // await driver.wait(async () => {
        //   const isPending = await mockedEndpoints.isPending();
        //   return isPending === false;
        // }, 10000);
        // const mockedRequests = await mockedEndpoints.getSeenRequests();
        // assert.equal(mockedRequests.length, 1);
        // const [firstMock] = mockedRequests;
        // const [mockJson] = firstMock.body.json.batch;
        // const { title, path } = mockJson.context.page;
        // assert.equal(title, 'Home');
        // assert.equal(path, '/');

        // assert.ok(notification, 'Dapp action does not appear in Metamask');
        // modify process.env.IN_TEST
      },
    );
  });
});
