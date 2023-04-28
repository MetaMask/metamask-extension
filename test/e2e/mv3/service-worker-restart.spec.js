const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const {
  ACTION_QUEUE_METRICS_E2E_TEST,
} = require('../../../shared/constants/test-flags');
const {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} = require('../../../shared/constants/metametrics');

const PRIVATE_KEY =
  '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC';

const generateETHBalance = (eth) => convertToHexValue(eth * 10 ** 18);
const defaultGanacheOptions = {
  accounts: [{ secretKey: PRIVATE_KEY, balance: generateETHBalance(25) }],
};

const numberOfSegmentRequests = 3;

async function mockSegment(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [
        {
          event: MetaMetricsEventName.ServiceWorkerRestarted,
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

describe('MV3 - Service worker restart', function () {
  let windowHandles;

  it('should continue to add new a account when service worker can not restart immediately', async function () {
    const driverOptions = { openDevToolsForTabs: true };
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
        testSpecificMock: mockSegment,
        driverOptions,
      },
      async ({ driver, mockedEndpoint }) => {
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
          const isPending = await mockedEndpoint.isPending();
          return isPending === false;
        }, 10_000);
        const mockedRequests = await mockedEndpoint.getSeenRequests();

        assert.equal(mockedRequests.length, numberOfSegmentRequests);

        await assertSWRestartTimeEvent(mockedRequests[0]);
        await assertSWRestartTimeEvent(mockedRequests[1]);
        await assertSWProcessActionQueueEvent(
          mockedRequests[2],
          'addNewAccount',
        );
      },
    );
  });
});

async function assertSWRestartTimeEvent(request) {
  assert.equal(request.url, 'https://api.segment.io/v1/batch');

  assert.equal(request.body.json.batch.length, 1);
  assert.equal(
    request.body.json.batch[0].event,
    MetaMetricsEventName.ServiceWorkerRestarted,
  );

  assert.equal(
    typeof request.body.json.batch[0].properties.service_worker_restarted_time,
    'number',
  );

  assert.equal(
    request.body.json.batch[0].properties.service_worker_restarted_time > 0,
    true,
  );
  assert.equal(
    request.body.json.batch[0].properties.category,
    MetaMetricsEventCategory.ServiceWorkers,
  );
  assert.equal(
    request.body.json.batch[0].properties.chain_id,
    convertToHexValue(1337),
  );
  assert.equal(
    request.body.json.batch[0].properties.environment_type,
    'background',
  );
  assert.equal(request.body.json.batch[0].properties.locale, 'en');
}

async function assertSWProcessActionQueueEvent(request, method) {
  assert.equal(request.url, 'https://api.segment.io/v1/batch');

  assert.equal(request.body.json.batch.length, 1);

  assert.equal(
    request.body.json.batch[0].event,
    MetaMetricsEventName.ServiceWorkerRestarted,
  );

  assert.equal(
    request.body.json.batch[0].properties.service_worker_action_queue_methods.indexOf(
      method,
    ) !== '-1',
    true,
  );
  assert.equal(
    request.body.json.batch[0].properties.category,
    MetaMetricsEventCategory.ServiceWorkers,
  );
  assert.equal(
    request.body.json.batch[0].properties.chain_id,
    convertToHexValue(1337),
  );
  assert.equal(
    request.body.json.batch[0].properties.environment_type,
    'background',
  );
  assert.equal(request.body.json.batch[0].properties.locale, 'en');
}
