import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { MockedEndpoint, Mockttp } from 'mockttp';
import {
  getCleanAppState,
  getEventPayloads,
  WINDOW_TITLES,
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
  openDapp,
} from '../../helpers';
import { TestSuiteArguments } from '../confirmations/transactions/shared';
import FixtureBuilder from '../../fixture-builder';

const selectors = {
  accountOptionsMenuButton: '[data-testid="account-options-menu-button"]',
  globalMenuSettingsButton: '[data-testid="global-menu-settings"]',
  securityAndPrivacySettings: { text: 'Security & privacy', tag: 'div' },
  dataCollectionForMarketingToggle:
    '[data-testid="dataCollectionForMarketing"] .toggle-button',
  dataCollectionWarningAckButton: { text: 'Okay', tag: 'Button' },
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
        batch: [{ type: 'track', event: 'Main Menu Opened' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
};

describe('Marketing cookieId', function (this: Suite) {
  it('should be send to segment when preferences are enabled', async function () {
    await withFixtures(
      {
        dapp: true,
        dappPaths: ['./tests/metrics/marketing-cookieid-mock-page'],
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
            dataCollectionForMarketing: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // waiting for marketingCampaignCookieId to update in state
        await driver.delay(5000);

        const uiState = await getCleanAppState(driver);
        assert.equal(uiState.metamask.marketingCampaignCookieId, 12345);

        await driver.clickElement(selectors.accountOptionsMenuButton);
        const events = await getEventPayloads(
          driver,
          mockedEndpoints as MockedEndpoint[],
        );
        assert.equal(events.length, 1);
        const eventContext = events[0].context;
        assert.equal(eventContext.marketingCampaignCookieId, 12345);
      },
    );
  });
  it('should not be send to segment when dataCollectionForMarketing is never toggled on', async function () {
    await withFixtures(
      {
        dapp: true,
        dappPaths: ['./tests/metrics/marketing-cookieid-mock-page'],
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // waiting for marketingCampaignCookieId to update in state
        await driver.delay(5000);

        const uiState = await getCleanAppState(driver);
        assert.equal(uiState.metamask.marketingCampaignCookieId, null);

        await driver.clickElement(selectors.accountOptionsMenuButton);
        const events = await getEventPayloads(
          driver,
          mockedEndpoints as MockedEndpoint[],
        );
        assert.equal(events.length, 1);
        const eventContext = events[0].context;
        assert.equal(eventContext.marketingCampaignCookieId, null);
      },
    );
  });
  it('should not be send to segment when participateInMetaMetrics is never toggled on ', async function () {
    await withFixtures(
      {
        dapp: true,
        dappPaths: ['./tests/metrics/marketing-cookieid-mock-page'],
        fixtures: new FixtureBuilder().withMetaMetricsController().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // waiting for marketingCampaignCookieId to update in state
        await driver.delay(5000);

        const uiState = await getCleanAppState(driver);
        assert.equal(uiState.metamask.marketingCampaignCookieId, null);

        await driver.clickElement(selectors.accountOptionsMenuButton);
        const events = await getEventPayloads(
          driver,
          mockedEndpoints as MockedEndpoint[],
        );
        assert.equal(events.length, 0);
      },
    );
  });
  it('should updates marketingCampaignCookieId to null when dataCollectionForMarketing is toggled off ', async function () {
    await withFixtures(
      {
        dapp: true,
        dappPaths: ['./tests/metrics/marketing-cookieid-mock-page'],
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
            dataCollectionForMarketing: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // waiting for marketingCampaignCookieId to update in state
        await driver.delay(5000);

        let uiState = await getCleanAppState(driver);
        assert.equal(uiState.metamask.marketingCampaignCookieId, 12345);

        await driver.clickElement(selectors.accountOptionsMenuButton);

        const events = await getEventPayloads(
          driver,
          mockedEndpoints as MockedEndpoint[],
        );
        assert.equal(events.length, 1);
        const eventContext = events[0].context;
        assert.equal(eventContext.marketingCampaignCookieId, 12345);

        await driver.clickElement(selectors.globalMenuSettingsButton);
        await driver.clickElement(selectors.securityAndPrivacySettings);
        await driver.clickElement(selectors.dataCollectionForMarketingToggle);
        await driver.clickElement(selectors.dataCollectionWarningAckButton);

        // waiting for marketingCampaignCookieId to update in state
        await driver.delay(5000);

        uiState = await getCleanAppState(driver);
        assert.equal(uiState.metamask.dataCollectionForMarketing, false);
        assert.equal(uiState.metamask.marketingCampaignCookieId, null);
      },
    );
  });
});
