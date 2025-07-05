import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES, sentryRegEx } from '../../helpers';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PreinstalledExampleSettings from '../../page-objects/pages/settings/preinstalled-example-settings';
import { TestSnaps } from '../../page-objects/pages/test-snaps';
import { MOCK_META_METRICS_ID } from '../../constants';

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

describe('Preinstalled example Snap', function () {
  it('displays the Snap settings page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const preInstalledExample = new PreinstalledExampleSettings(driver);
        await navigateToPreInstalledExample(driver);

        await preInstalledExample.clickToggleButtonOn();
        await preInstalledExample.selectRadioOption('Option 2');
        await preInstalledExample.selectDropdownOption('Option 2');
        await preInstalledExample.check_isToggleOn();
        assert.equal(
          await preInstalledExample.check_selectedRadioOption('Option 2'),
          true,
        );
        await preInstalledExample.check_selectedDropdownOption('Option 2');

        // Navigate to `test-snaps` page, we don't need to connect because the Snap uses
        // initialConnections to pre-approve the dapp.
        const testSnaps = new TestSnaps(driver);
        await testSnaps.openPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.clickButton('getSettingsStateButton');
        const jsonTextValidation = '"setting1": true';
        await testSnaps.check_messageResultSpan(
          'rpcResultSpan',
          jsonTextValidation,
        );
      },
    );
  });

  it('uses `initialConnections` to allow JSON-RPC', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        await testSnaps.openPage();

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

  // TODO: Remove `.only`.
  it.only('tracks an error in Sentry with `snap_trackError`', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSentryTestError,
        manifestFlags: {
          sentry: { forceEnable: false },
        },
      },
      async ({ driver, mockedEndpoint }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        await testSnaps.openPage();

        // Click the button to track an error.
        await testSnaps.scrollAndClickButton('trackErrorButton');

        // Wait for the mocked Sentry endpoint to be called.
        await driver.wait(async () => {
          const isPending = await mockedEndpoint.isPending();
          return isPending === false;
        }, 10_000);

        const requests = await mockedEndpoint.getSeenRequests();
        assert.equal(requests.length, 1, 'Expected one request to Sentry.');

        const request = requests[0];
        const [event, type, data] = (await request.body.getText()).split('\n');

        console.log('Sentry event:', JSON.parse(event));
        console.log('Sentry type:', JSON.parse(type));
        console.log('Sentry data:', JSON.parse(data));
      },
    );
  });
});

async function navigateToPreInstalledExample(driver: Driver) {
  const headerNavbar = new HeaderNavbar(driver);
  const settingsPage = new SettingsPage(driver);
  const preInstalledExample = new PreinstalledExampleSettings(driver);

  await headerNavbar.openSettingsPage();
  await headerNavbar.check_pageIsLoaded();

  await settingsPage.goToPreInstalledExample();
  await preInstalledExample.check_pageIsLoaded();
}
