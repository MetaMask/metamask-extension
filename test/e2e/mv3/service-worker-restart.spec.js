const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const {
  ACTION_QUEUE_METRICS_E2E_TEST,
} = require('../../../shared/constants/test-flags');
const { EVENT_NAMES, EVENT } = require('../../../shared/constants/metametrics');

const PRIVATE_KEY =
  '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC';

const generateETHBalance = (eth) => convertToHexValue(eth * 10 ** 18);
const defaultGanacheOptions = {
  accounts: [{ secretKey: PRIVATE_KEY, balance: generateETHBalance(25) }],
};

const numberOfSegmentRequests = 1;

async function mockSegment(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [
        {
          event: EVENT_NAMES.SERVICE_WORKER_RESTARTED,
        },
      ],
    })
    .times(numberOfSegmentRequests)
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function mockPostToSentryEnvelope(mockServer) {
  await mockServer
    .forPost('https://sentry.io/api/0000000/envelope/')
    .withQuery({ sentry_key: 'fake', sentry_version: '7' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });
}

describe('MV3 - Service worker restart', function () {
  let windowHandles;

  it('should continue to add new a account when service worker can not restart immediately', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .withAppStateController({
            [ACTION_QUEUE_METRICS_E2E_TEST]: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
        // because of segment
        failOnConsoleError: false,
        testSpecificMock: mockPostToSentryEnvelope,
      },
      async ({ driver, mockServer }) => {
        const mockedSegmentEndpoints = await mockSegment(mockServer);

        await driver.navigate();

        // unlock wallet
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // open the account menu
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement({ text: 'Create account', tag: 'div' });

        await driver.fill('.new-account-create-form__input', 'Test Account');

        await driver.clickElement({ text: 'Create', tag: 'button' });

        await driver.openNewPage('chrome://inspect/#service-workers/');
        await driver.clickElement({
          text: 'Service workers',
          tag: 'button',
        });

        await driver.clickElement({
          text: 'terminate',
          tag: 'span',
        });

        windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindow(extension);

        // balance renders
        await driver.waitForSelector(
          {
            css: '[class="eth-overview__primary-container"]',
            // balance is 0 because we switched to an empty account
            text: '0 ETH',
          },
          { timeout: 50_000 },
        );

        await driver.findElement({ text: '0x097...7950', tag: 'div' });

        // assert that the segment request has been sent through inspecting the mock
        await driver.wait(async () => {
          const isPending = await mockedSegmentEndpoints.isPending();
          return isPending === false;
        }, 10_000);
        const mockedRequests = await mockedSegmentEndpoints.getSeenRequests();

        assert.equal(mockedRequests.length, numberOfSegmentRequests);

        assert.equal(mockedRequests[0].url, 'https://api.segment.io/v1/batch');

        assert.equal(mockedRequests[0].body.json.batch.length, 1);
        assert.equal(
          mockedRequests[0].body.json.batch[0].event,
          EVENT_NAMES.SERVICE_WORKER_RESTARTED,
        );

        assert.equal(
          mockedRequests[0].body.json.batch[0].properties.service_worker_action_queue_methods.indexOf(
            'addNewAccount',
          ) !== '-1',
          true,
        );
        assert.equal(
          mockedRequests[0].body.json.batch[0].properties.category,
          EVENT.SOURCE.SERVICE_WORKERS,
        );
        assert.equal(
          mockedRequests[0].body.json.batch[0].properties.category,
          EVENT.SOURCE.SERVICE_WORKERS,
        );
        assert.equal(
          mockedRequests[0].body.json.batch[0].properties.chain_id,
          convertToHexValue(1337),
        );
        assert.equal(
          mockedRequests[0].body.json.batch[0].properties.environment_type,
          'background',
        );
        assert.equal(
          mockedRequests[0].body.json.batch[0].properties.locale,
          'en',
        );

        await new Promise((resolve) => setTimeout(resolve, 20_000));
      },
    );
  });
});
