import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

async function mockedDappViewedEndpointFirstVisit(mockServer: Mockttp) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [
        {
          type: 'track',
          event: MetaMetricsEventName.DappViewed,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_first_visit: true,
          },
        },
      ],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function mockedDappViewedEndpointReVisit(mockServer: Mockttp) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [
        {
          type: 'track',
          event: MetaMetricsEventName.DappViewed,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_first_visit: false,
          },
        },
      ],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function mockPermissionApprovedEndpoint(mockServer: Mockttp) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Permissions Approved' }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

describe('Dapp viewed Event', function () {
  before(function () {
    // currently we are not emitting dapp viewed events on Firefox
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      this.skip();
    }
  });
  const validFakeMetricsId = 'fake-metrics-fd20';
  it('is not sent when metametrics ID is not valid', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [await mockedDappViewedEndpointFirstVisit(mockServer)];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'invalid-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount({
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 0);
      },
    );
  });

  it('is sent when navigating to dapp with no account connected', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [await mockedDappViewedEndpointFirstVisit(mockServer)];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: validFakeMetricsId, // 1% sample rate for dapp viewed event
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount({
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });

        const events = await getEventPayloads(driver, mockedEndpoints);
        const dappViewedEventProperties = events[0].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, true);
        assert.equal(dappViewedEventProperties.number_of_accounts, 1);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });

  it('is sent when opening the dapp in a new tab with one account connected', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedDappViewedEndpointFirstVisit(mockServer),
        await mockedDappViewedEndpointReVisit(mockServer),
        await mockPermissionApprovedEndpoint(mockServer),
      ];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: validFakeMetricsId,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount({
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });
        // open dapp in a new page
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        const events = await getEventPayloads(driver, mockedEndpoints);
        // events are original dapp viewed, new dapp viewed when refresh, and permission approved
        const dappViewedEventProperties = events[1].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, false);
        assert.equal(dappViewedEventProperties.number_of_accounts, 1);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });

  it('is sent when refreshing dapp with one account connected', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedDappViewedEndpointFirstVisit(mockServer),
        await mockedDappViewedEndpointReVisit(mockServer),
        await mockPermissionApprovedEndpoint(mockServer),
      ];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: validFakeMetricsId,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount({
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });
        // refresh dapp
        await driver.refresh();
        await testDapp.check_pageIsLoaded();
        const events = await getEventPayloads(driver, mockedEndpoints);

        // events are original dapp viewed, navigate to dapp, new dapp viewed when refresh, new dapp viewed when navigate and permission approved
        const dappViewedEventProperties = events[1].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, false);
        assert.equal(dappViewedEventProperties.number_of_accounts, 1);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });

  it('is sent when navigating to a connected dapp', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedDappViewedEndpointFirstVisit(mockServer),
        await mockedDappViewedEndpointReVisit(mockServer),
        await mockedDappViewedEndpointFirstVisit(mockServer),
        await mockedDappViewedEndpointReVisit(mockServer),
        await mockPermissionApprovedEndpoint(mockServer),
      ];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: validFakeMetricsId,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount({
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });
        // open dapp in a new page and switch to second connected dapp
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        const events = await getEventPayloads(driver, mockedEndpoints);
        // events are original dapp viewed, navigate to dapp, new dapp viewed when refresh, new dapp viewed when navigate and permission approved
        const dappViewedEventProperties = events[2].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, false);
        assert.equal(dappViewedEventProperties.number_of_accounts, 1);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });

  it('is sent when reconnect to a dapp that has been connected before', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedDappViewedEndpointFirstVisit(mockServer),
        await mockedDappViewedEndpointReVisit(mockServer),
      ];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: validFakeMetricsId,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);
        // connect to dapp and disconnect
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount({
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });
        await testDapp.disconnectAccount(DEFAULT_FIXTURE_ACCOUNT);

        // reconnect again on test dapp
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount({
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 2);
        // events are original dapp viewed, new dapp viewed when reconnected
        const dappViewedEventProperties = events[1].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, false);
        assert.equal(dappViewedEventProperties.number_of_accounts, 1);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });
});
