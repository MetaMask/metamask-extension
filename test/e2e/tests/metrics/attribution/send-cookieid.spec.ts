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
} from '../../../helpers';
import { TestSuiteArguments } from '../../confirmations/transactions/shared';
import FixtureBuilder from '../../../fixture-builder';

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

describe('Send cookieId', function (this: Suite) {
  it('executes a postmessage script', async function () {
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
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await unlockWallet(driver);

        await driver.openNewPage(`http://127.0.0.1:8080`);

        // const cookieIdRequest = JSON.stringify(
        //   {
        //     target: 'metamask-contentscript',
        //     data: {
        //       name: 'metamask-cookie-handler',
        //       data: {
        //         jsonrpc: '2.0',
        //         method: 'getCookieFromMarketingPage',
        //         params: [{ ga_client_id: 12345, origin: 'http://127.0.0.1:8080' }],
        //         id: '1234',
        //         origin: 'http://127.0.0.1:8080',
        //       },
        //     },
        //   },
        // );

        // await driver.executeScript(
        //   `return  window.postMessage(${cookieIdRequest},'http://127.0.0.1:8080')`,
        // );
        // wait for state to update
        await driver.delay(500);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const uiState = await getCleanAppState(driver);

        assert.equal(uiState.metamask.marketingCampaignCookieId, '12345');
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        const events = await getEventPayloads(
          driver,
          mockedEndpoints as MockedEndpoint[],
        );
        assert.equal(events.length, 1);
        // events are original dapp viewed, new dapp viewed when refresh, and permission approved
        const eventContext = events[0].context;
        assert.equal(eventContext.marketingCampaignCookieId, '12345');
      },
    );
  });
});
