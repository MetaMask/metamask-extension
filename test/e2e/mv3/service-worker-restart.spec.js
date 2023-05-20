const { strict: assert } = require('assert');

const {
  convertToHexValue,
  withFixtures,
  openDapp,
  SERVICE_WORKER_URL,
  defaultGanacheOptions,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const {
  ACTION_QUEUE_METRICS_E2E_TEST,
} = require('../../../shared/constants/test-flags');
const {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} = require('../../../shared/constants/metametrics');

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
  const driverOptions = { openDevToolsForTabs: true };

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

        await driver.openNewPage(SERVICE_WORKER_URL);
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

  it('should restore the transaction when service worker restarts', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
        // because of segment
        failOnConsoleError: false,
        driverOptions,
      },
      async ({ driver }) => {
        await driver.navigate();
        // log in wallet
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // initialize a transaction of send from dapp
        await openDapp(driver);
        await driver.clickElement('#sendButton');

        // A popup window is initialized
        windowHandles = await driver.getAllWindowHandles();
        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // Assert recipient and eth quantity are correct
        await assertTransactionDetails(driver);

        // Restart service worker in a new window
        // Because if we stay in the same window we will lose the popup when opening a new tab
        await driver.switchToNewWindow();
        await driver.openNewURL(SERVICE_WORKER_URL);
        windowHandles = await driver.getAllWindowHandles();
        // MM expanded view, Dapp, Notification popup, console and service worker
        await driver.waitUntilXWindowHandles(5);
        await driver.clickElement({
          text: 'terminate',
          tag: 'span',
        });

        // Should still have only 1 popup
        windowHandles = await driver.getAllWindowHandles();
        await driver.waitUntilXWindowHandles(5);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // And popup has the same value
        await assertTransactionDetails(driver);

        // Confirm the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.switchToWindowWithTitle('MetaMask', windowHandles);
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);
      },
    );
  });
});

async function assertSWRestartTimeEvent(request) {
  assert.equal(request.url, 'https://api.segment.io/v1/batch');

  assert.equal(request.body.json.batch.length, 1);

  const [firstResult] = request.body.json.batch;

  assert.equal(firstResult.event, MetaMetricsEventName.ServiceWorkerRestarted);

  assert.equal(
    typeof firstResult.properties.service_worker_restarted_time,
    'number',
  );

  assert.equal(firstResult.properties.service_worker_restarted_time > 0, true);
  assert.equal(
    firstResult.properties.category,
    MetaMetricsEventCategory.ServiceWorkers,
  );
  assert.equal(firstResult.properties.chain_id, convertToHexValue(1337));
  assert.equal(firstResult.properties.environment_type, 'background');
  assert.equal(firstResult.properties.locale, 'en');
}

async function assertSWProcessActionQueueEvent(request, method) {
  assert.equal(request.url, 'https://api.segment.io/v1/batch');

  assert.equal(request.body.json.batch.length, 1);

  const [firstResult] = request.body.json.batch;

  assert.equal(firstResult.event, MetaMetricsEventName.ServiceWorkerRestarted);

  assert.equal(
    firstResult.properties.service_worker_action_queue_methods.indexOf(
      method,
    ) !== '-1',
    true,
  );
  assert.equal(
    firstResult.properties.category,
    MetaMetricsEventCategory.ServiceWorkers,
  );
  assert.equal(firstResult.properties.chain_id, convertToHexValue(1337));
  assert.equal(firstResult.properties.environment_type, 'background');
  assert.equal(firstResult.properties.locale, 'en');
}

async function assertTransactionDetails(driver) {
  const TRUNCATED_RECIPIENT_ADDRESS = '0x0c5...AaFb';
  const recipientAddress = await driver.findElement(
    '[data-testid="sender-to-recipient__name"]',
  );
  assert.equal(await recipientAddress.getText(), TRUNCATED_RECIPIENT_ADDRESS);
  const transactionAmounts = await driver.findElements(
    '.currency-display-component__text',
  );
  const transactionAmount = transactionAmounts[0];
  assert.equal(await transactionAmount.getText(), '0');
}
