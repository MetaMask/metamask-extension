import { strict as assert } from 'assert';
import { MockedEndpoint, Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { TestSuiteArguments } from '../confirmations/transactions/shared';
import { MOCK_META_METRICS_ID } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

/**
 * mocks the segment api multiple times for specific payloads that we expect to
 * see when these tests are run. In this case we are looking for
 * 'Permissions Requested' and 'Permissions Received'. Do not use the constants
 * from the metrics constants files, because if these change we want a strong
 * indicator to our data team that the shape of data will change.
 *
 * @param mockServer
 * @returns
 */
const mockSegment = async (mockServer: Mockttp) => {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          { type: 'track', event: 'Delete MetaMetrics Data Request Submitted' },
        ],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://metametrics.metamask.test/regulations/sources/test')
      .withHeaders({ 'Content-Type': 'application/vnd.segment.v1+json' })
      .withBodyIncluding(
        JSON.stringify({
          regulationType: 'DELETE_ONLY',
          subjectType: 'USER_ID',
          subjectIds: [MOCK_META_METRICS_ID],
        }),
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: { data: { regulateId: 'fake-delete-regulation-id' } },
      })),
    await mockServer
      .forGet(
        'https://metametrics.metamask.test/regulations/fake-delete-regulation-id',
      )
      .withHeaders({ 'Content-Type': 'application/vnd.segment.v1+json' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          data: {
            regulation: {
              overallStatus: 'FINISHED',
            },
          },
        },
      })),
  ];
};
/**
 * Scenarios:
 * 1. Deletion while Metrics is Opted in.
 * 2. Deletion while Metrics is Opted out.
 * 3. Deletion when user never opted for metrics.
 */
describe('Delete MetaMetrics Data', function (this: Suite) {
  it('while user has opted in for metrics tracking', async function () {
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
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        // delete MetaMetrics data on privacy settings page
        const privacySettings = new PrivacySettings(driver);
        await privacySettings.check_pageIsLoaded();
        await privacySettings.deleteMetaMetrics();
        assert.equal(
          await privacySettings.check_deleteMetaMetricsDataButtonEnabled(),
          false,
        );

        const events = await getEventPayloads(
          driver,
          mockedEndpoints as MockedEndpoint[],
        );
        assert.equal(events.length, 3);
        assert.deepStrictEqual(events[0].properties, {
          category: 'Settings',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x539',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'fullscreen',
        });

        await settingsPage.closeSettingsPage();
        await new HomePage(driver).check_pageIsLoaded();
        await headerNavbar.openSettingsPage();
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        // check MetaMetrics data button is enabled when user goes back to privacy settings page
        await privacySettings.check_pageIsLoaded();
        assert.equal(
          await privacySettings.check_deleteMetaMetricsDataButtonEnabled(),
          true,
        );
      },
    );
  });

  it('while user has opted out for metrics tracking', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: false,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver }: TestSuiteArguments) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.check_pageIsLoaded();
        assert.equal(
          await privacySettings.check_deleteMetaMetricsDataButtonEnabled(),
          false,
        );
      },
    );
  });

  it('when the user has never opted in for metrics', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.check_pageIsLoaded();
        assert.equal(
          await privacySettings.check_deleteMetaMetricsDataButtonEnabled(),
          false,
        );
      },
    );
  });
});
