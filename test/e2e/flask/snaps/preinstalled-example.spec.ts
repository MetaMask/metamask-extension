import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES, sentryRegEx } from '../../helpers';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PreinstalledExampleSettings from '../../page-objects/pages/settings/preinstalled-example-settings';
import { TestSnaps } from '../../page-objects/pages/test-snaps';
import { DAPP_PATH, MOCK_META_METRICS_ID } from '../../constants';
import { mockTestSnapsSite } from '../../mock-response-data/snaps/snap-local-sites/test-snaps-site-mocks';
import { TEST_SNAPS_WEBSITE_URL } from '../../snaps/enums';

async function mockSentryTestError(mockServer: Mockttp) {
  return await mockServer
    .forPost(sentryRegEx)
    .withBodyIncluding('This is a test error.')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });
}

async function mockSentryTrace(mockServer: Mockttp) {
  return await mockServer
    .forPost(sentryRegEx)
    .withBodyIncluding('Test Snap Trace')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: '1234567890abcdef',
        },
      };
    });
}

async function mockSegment(mockServer: Mockttp) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withBodyIncluding('Test Event')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });
}

describe('Preinstalled example Snap', function () {
  it('displays the Snap settings page', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockTestSnapsSite,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const preInstalledExample = new PreinstalledExampleSettings(driver);
        await navigateToPreInstalledExample(driver);

        await preInstalledExample.clickToggleButtonOn();
        await preInstalledExample.selectRadioOption('Option 2');
        await preInstalledExample.selectDropdownOption('Option 2');
        await preInstalledExample.checkIsToggleOn();
        await preInstalledExample.checkSelectedRadioOption('option2');
        await preInstalledExample.checkSelectedDropdownOption('option2');
        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );

        // Navigate to `test-snaps` page, we don't need to connect because the Snap uses
        // initialConnections to pre-approve the dapp.
        const testSnaps = new TestSnaps(driver);
        // We cannot go to localhost directly because snap permissions doen't allow localhost (but they do metamask.github.io).
        // So instead, we go to the real URL and we use a proxy it so the responses come from the localhost test-snap server.
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
        await testSnaps.clickButton('getSettingsStateButton');
        const jsonTextValidation = JSON.stringify(
          { setting1: true, setting2: 'option2', setting3: 'option2' },
          null,
          2,
        );
        await testSnaps.checkMessageResultSpan(
          'rpcResultSpan',
          jsonTextValidation,
        );
      },
    );
  });

  it('uses `initialConnections` to allow JSON-RPC', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockTestSnapsSite,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        // We cannot go to localhost directly because snap permissions doen't allow localhost (but they do metamask.github.io).
        // So instead, we go to the real URL and we use a proxy it so the responses come from the localhost test-snap server.
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // This test clicks this button without connecting and functions as E2E
        // for the initialConnections functionality.
        await testSnaps.scrollAndClickButton('showPreinstalledDialogButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector({
          css: '.snap-ui-renderer__text',
          text: 'This is a custom dialog. It has a custom footer and can be resolved to any value.',
        });
      },
    );
  });

  it('tracks an error in Sentry with `snap_trackError`', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          // Only return Sentry as it's the one we need for the assertions
          await mockTestSnapsSite(mockServer);
          return await mockSentryTestError(mockServer);
        },
        manifestFlags: {
          sentry: { forceEnable: false },
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        // We cannot go to localhost directly because snap permissions doen't allow localhost (but they do metamask.github.io).
        // So instead, we go to the real URL and we use a proxy it so the responses come from the localhost test-snap server.
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // Click the button to track an error.
        await testSnaps.scrollAndClickButton('trackErrorButton');

        // Wait for the mocked Sentry endpoint to be called.
        await driver.wait(async () => {
          const isPending = await mockedEndpoint.isPending();
          return isPending === false;
        }, 5000);

        const requests = await mockedEndpoint.getSeenRequests();
        assert.equal(requests.length, 1, 'Expected one request to Sentry.');

        const request = requests[0];
        const [, , data] = (await request.body.getText()).split('\n');
        const [error] = JSON.parse(data).exception.values;

        assert.equal(error.type, 'TestError');
        assert.equal(error.value, 'This is a test error.');
      },
    );
  });

  it('tracks an event in Segment with `snap_trackEvent`', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          // Only return Sentry as it's the one we need for the assertions
          await mockTestSnapsSite(mockServer);
          return await mockSegment(mockServer);
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        // We cannot go to localhost directly because snap permissions doen't allow localhost (but they do metamask.github.io).
        // So instead, we go to the real URL and we use a proxy it so the responses come from the localhost test-snap server.
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // Click the button to track an event.
        await testSnaps.scrollAndClickButton('trackEventButton');

        // Wait for the mocked Sentry endpoint to be called.
        await driver.wait(async () => {
          const isPending = await mockedEndpoint.isPending();
          return isPending === false;
        }, 5000);

        const requests = await mockedEndpoint.getSeenRequests();
        assert.equal(requests.length, 1, 'Expected one request to Segment.');

        const request = requests[0];
        const json = JSON.parse(await request.body.getText());
        assert.equal(json.batch[0].type, 'track');
        assert.equal(json.batch[0].event, 'Test Event');
        assert.equal(json.batch[0].properties.test_property, 'test value');
      },
    );
  });

  it('starts and ends a performance trace in Sentry with `snap_startTrace` and `snap_endTrace`', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          // Only return Sentry as it's the one we need for the assertions
          await mockTestSnapsSite(mockServer);
          return await mockSentryTrace(mockServer);
        },
        manifestFlags: {
          sentry: { forceEnable: false },
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        // We cannot go to localhost directly because snap permissions doen't allow localhost (but they do metamask.github.io).
        // So instead, we go to the real URL and we use a proxy it so the responses come from the localhost test-snap server.
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // Click the button to start and end a trace.
        await testSnaps.scrollAndClickButton('startTraceButton');
        await driver.delay(100);
        await testSnaps.scrollAndClickButton('endTraceButton');

        // Wait for the mocked Sentry endpoint to be called.
        await driver.wait(async () => {
          const isPending = await mockedEndpoint.isPending();
          return isPending === false;
        }, 5000);

        const requests = await mockedEndpoint.getSeenRequests();
        assert.equal(requests.length, 1, 'Expected one request to Sentry.');

        const request = requests[0];
        const [, , data] = (await request.body.getText()).split('\n');
        const json = JSON.parse(data);

        assert.equal(json.contexts.trace.op, 'custom');
        assert.equal(json.contexts.trace.origin, 'manual');
        assert.equal(json.transaction, 'Test Snap Trace');
      },
    );
  });
});

async function navigateToPreInstalledExample(driver: Driver) {
  const headerNavbar = new HeaderNavbar(driver);
  const settingsPage = new SettingsPage(driver);
  const preInstalledExample = new PreinstalledExampleSettings(driver);

  await headerNavbar.openSettingsPage();

  await settingsPage.goToPreInstalledExample();
  await preInstalledExample.checkPageIsLoaded();
}
