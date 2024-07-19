import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import {
  defaultGanacheOptions,
  withFixtures,
  getEventPayloads,
  unlockWallet,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';

const rowLocators = {
  accountOptionsMenuButton: '[data-testid="account-options-menu-button"]',
  globalMenuSettingsButton: '[data-testid="global-menu-settings"]',
  securityAndPrivacySettings: { text: 'Security & privacy', tag: 'div' },
  experimentalSettings: { text: 'Experimental', tag: 'div' },
  deletMetaMetricsSettings: '[data-testid="delete-metametrics-data-button"]',
  deleteMetaMetricsDataButton: {
    text: 'Delete MetaMetrics data',
    tag: 'button',
  },
  clearButton: { text: 'Clear', tag: 'button' },
  backButton: '[data-testid="settings-back-button"]',
};

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
          subjectIds: ['fake-metrics-id'],
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
describe('Delete MetaMetrics Data @no-mmi', function (this: Suite) {
  it('while user has opted in for metrics tracking', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: Mockttp;
      }) => {
        await unlockWallet(driver);

        await driver.clickElement(rowLocators.accountOptionsMenuButton);
        await driver.clickElement(rowLocators.globalMenuSettingsButton);
        await driver.clickElement(rowLocators.securityAndPrivacySettings);

        await driver.findElement(rowLocators.deletMetaMetricsSettings);
        await driver.clickElement(rowLocators.deleteMetaMetricsDataButton);

        // there is a race condition, where we need to wait before clicking clear button otherwise an error is thrown in the background
        // we cannot wait for a UI conditon, so we a delay to mitigate this until another solution is found
        await driver.delay(3000);
        await driver.clickElementAndWaitToDisappear(rowLocators.clearButton);

        const deleteMetaMetricsDataButton = await driver.findElement(
          rowLocators.deleteMetaMetricsDataButton,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (deleteMetaMetricsDataButton as any).waitForElementState(
          'disabled',
        );
        assert.equal(
          await deleteMetaMetricsDataButton.isEnabled(),
          false,
          'Delete MetaMetrics data button is disabled',
        );

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 3);
        assert.deepStrictEqual(events[0].properties, {
          category: 'Settings',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'fullscreen',
        });
        await driver.clickElement(rowLocators.experimentalSettings);
        await driver.clickElement(rowLocators.securityAndPrivacySettings);

        const deleteMetaMetricsDataButtonRefreshed = await driver.findElement(
          rowLocators.deleteMetaMetricsDataButton,
        );
        assert.equal(
          await deleteMetaMetricsDataButtonRefreshed.isEnabled(),
          true,
          'Delete MetaMetrics data button is enabled',
        );
      },
    );
  });
  it('while user has opted out for metrics tracking', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
          })
          .build(),
        defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: Mockttp;
      }) => {
        await unlockWallet(driver);

        await driver.clickElement(rowLocators.accountOptionsMenuButton);
        await driver.clickElement(rowLocators.globalMenuSettingsButton);
        await driver.clickElement(rowLocators.securityAndPrivacySettings);

        await driver.findElement(rowLocators.deletMetaMetricsSettings);
        await driver.clickElement(rowLocators.deleteMetaMetricsDataButton);

        // there is a race condition, where we need to wait before clicking clear button otherwise an error is thrown in the background
        // we cannot wait for a UI conditon, so we a delay to mitigate this until another solution is found
        await driver.delay(3000);
        await driver.clickElementAndWaitToDisappear(rowLocators.clearButton);

        const deleteMetaMetricsDataButton = await driver.findElement(
          rowLocators.deleteMetaMetricsDataButton,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (deleteMetaMetricsDataButton as any).waitForElementState(
          'disabled',
        );
        assert.equal(
          await deleteMetaMetricsDataButton.isEnabled(),
          false,
          'Delete MetaMetrics data button is disabled',
        );

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 2);

        await driver.clickElement(rowLocators.experimentalSettings);
        await driver.clickElement(rowLocators.securityAndPrivacySettings);

        const deleteMetaMetricsDataButtonRefreshed = await driver.findElement(
          rowLocators.deleteMetaMetricsDataButton,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (deleteMetaMetricsDataButtonRefreshed as any).waitForElementState(
          'disabled',
        );
        assert.equal(
          await deleteMetaMetricsDataButtonRefreshed.isEnabled(),
          false,
          'Delete MetaMetrics data button is disabled',
        );
      },
    );
  });
  it('when the user has never opted in for metrics', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        await driver.clickElement(rowLocators.accountOptionsMenuButton);
        await driver.clickElement(rowLocators.globalMenuSettingsButton);
        await driver.clickElement(rowLocators.securityAndPrivacySettings);
        await driver.findElement(rowLocators.deletMetaMetricsSettings);

        const deleteMetaMetricsDataButton = await driver.findElement(
          rowLocators.deleteMetaMetricsDataButton,
        );
        assert.equal(
          await deleteMetaMetricsDataButton.isEnabled(),
          false,
          'Delete MetaMetrics data button is disabled',
        );
      },
    );
  });
});
