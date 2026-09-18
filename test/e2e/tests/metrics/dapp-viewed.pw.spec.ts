import { strict as assert } from 'assert';
import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { E2E_DRIVER, DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import TestDapp from '../../page-objects/pages/test-dapp';
import { login } from '../../page-objects/flows/login.flow';
import { connectAccountToTestDapp } from '../../page-objects/flows/test-dapp.flow';

// E2E Fixtures setup has 4 identities (1 EVM, 1 Solana, 1 Bitcoin, 1 Tron)
const METAMASK_IDENTITIES = 4;

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

pwTest.describe('Dapp viewed Event', () => {
  pwTest.skip(
    process.env.SELENIUM_BROWSER === Browser.FIREFOX,
    'Dapp Viewed events are not emitted on Firefox',
  );
  const validFakeMetricsId = 'fake-metrics-fd20';
  pwTest('is not sent when metametrics ID is not valid', async () => {
    async function mockSegment(mockServer: Mockttp) {
      return [await mockedDappViewedEndpointFirstVisit(mockServer)];
    }

    await withFixtures(
      {
        driverType: E2E_DRIVER.PLAYWRIGHT,
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            // Non-null invalid ID: null is replaced with a generated ID at
            // AnalyticsController init, which can still sample into the 1%.
            analyticsId: 'fake-metrics-id-invalid',
            consentDecisionMade: true,
            optedIn: true,
          })
          .build(),
        title: pwTest.info().titlePath.join(' '),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await connectAccountToTestDapp(driver, {
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 0);
      },
    );
  });

  pwTest(
    'is sent when navigating to dapp with no account connected',
    async () => {
      async function mockSegment(mockServer: Mockttp) {
        return [await mockedDappViewedEndpointFirstVisit(mockServer)];
      }

      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withMetaMetricsController({
              analyticsId: validFakeMetricsId, // 1% sample rate for dapp viewed event
              consentDecisionMade: true,
              optedIn: true,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSegment,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await login(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectAccountToTestDapp(driver, {
            publicAddress: DEFAULT_FIXTURE_ACCOUNT,
          });

          const events = await getEventPayloads(driver, mockedEndpoints);
          const dappViewedEventProperties = events[0].properties;
          assert.equal(dappViewedEventProperties.is_first_visit, true);
          assert.equal(
            dappViewedEventProperties.number_of_accounts,
            METAMASK_IDENTITIES,
          );
          assert.equal(
            dappViewedEventProperties.number_of_accounts_connected,
            1,
          );
        },
      );
    },
  );

  pwTest(
    'is sent when opening the dapp in a new tab with one account connected',
    async () => {
      async function mockSegment(mockServer: Mockttp) {
        return [
          await mockedDappViewedEndpointFirstVisit(mockServer),
          await mockedDappViewedEndpointReVisit(mockServer),
          await mockPermissionApprovedEndpoint(mockServer),
        ];
      }

      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withMetaMetricsController({
              analyticsId: validFakeMetricsId,
              consentDecisionMade: true,
              optedIn: true,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSegment,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await login(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectAccountToTestDapp(driver, {
            publicAddress: DEFAULT_FIXTURE_ACCOUNT,
          });
          // open dapp in a new page
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          const events = await getEventPayloads(driver, mockedEndpoints);
          // events are original dapp viewed, new dapp viewed when refresh, and permission approved
          const dappViewedEventProperties = events[1].properties;
          assert.equal(dappViewedEventProperties.is_first_visit, false);
          assert.equal(
            dappViewedEventProperties.number_of_accounts,
            METAMASK_IDENTITIES,
          );
          assert.equal(
            dappViewedEventProperties.number_of_accounts_connected,
            1,
          );
        },
      );
    },
  );

  pwTest(
    'is sent when refreshing dapp with one account connected',
    async () => {
      async function mockSegment(mockServer: Mockttp) {
        return [
          await mockedDappViewedEndpointFirstVisit(mockServer),
          await mockedDappViewedEndpointReVisit(mockServer),
          await mockPermissionApprovedEndpoint(mockServer),
        ];
      }

      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withMetaMetricsController({
              analyticsId: validFakeMetricsId,
              consentDecisionMade: true,
              optedIn: true,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSegment,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await login(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectAccountToTestDapp(driver, {
            publicAddress: DEFAULT_FIXTURE_ACCOUNT,
          });
          // refresh dapp
          await driver.refresh();
          await testDapp.checkPageIsLoaded();
          const events = await getEventPayloads(driver, mockedEndpoints);

          // events are original dapp viewed, navigate to dapp, new dapp viewed when refresh, new dapp viewed when navigate and permission approved
          const dappViewedEventProperties = events[1].properties;
          assert.equal(dappViewedEventProperties.is_first_visit, false);
          assert.equal(
            dappViewedEventProperties.number_of_accounts,
            METAMASK_IDENTITIES,
          );
          assert.equal(
            dappViewedEventProperties.number_of_accounts_connected,
            1,
          );
        },
      );
    },
  );

  pwTest('is sent when navigating to a connected dapp', async () => {
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
        driverType: E2E_DRIVER.PLAYWRIGHT,
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            analyticsId: validFakeMetricsId,
            consentDecisionMade: true,
            optedIn: true,
          })
          .build(),
        title: pwTest.info().titlePath.join(' '),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await connectAccountToTestDapp(driver, {
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });
        // open dapp in a new page and switch to second connected dapp
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const events = await getEventPayloads(driver, mockedEndpoints);
        // events are original dapp viewed, navigate to dapp, new dapp viewed when refresh, new dapp viewed when navigate and permission approved
        const dappViewedEventProperties = events[2].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, false);
        assert.equal(
          dappViewedEventProperties.number_of_accounts,
          METAMASK_IDENTITIES,
        );
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });

  pwTest(
    'is sent when reconnect to a dapp that has been connected before',
    async () => {
      async function mockSegment(mockServer: Mockttp) {
        return [
          await mockedDappViewedEndpointFirstVisit(mockServer),
          await mockedDappViewedEndpointReVisit(mockServer),
        ];
      }

      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withMetaMetricsController({
              analyticsId: validFakeMetricsId,
              consentDecisionMade: true,
              optedIn: true,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSegment,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await login(driver);
          // connect to dapp and disconnect
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectAccountToTestDapp(driver, {
            publicAddress: DEFAULT_FIXTURE_ACCOUNT,
          });
          await testDapp.disconnectAccount(DEFAULT_FIXTURE_ACCOUNT);

          // reconnect again on test dapp
          await testDapp.checkPageIsLoaded();
          await connectAccountToTestDapp(driver, {
            publicAddress: DEFAULT_FIXTURE_ACCOUNT,
          });

          const events = await getEventPayloads(driver, mockedEndpoints);
          assert.equal(events.length, 2);
          // events are original dapp viewed, new dapp viewed when reconnected
          const dappViewedEventProperties = events[1].properties;
          assert.equal(dappViewedEventProperties.is_first_visit, false);
          assert.equal(
            dappViewedEventProperties.number_of_accounts,
            METAMASK_IDENTITIES,
          );
          assert.equal(
            dappViewedEventProperties.number_of_accounts_connected,
            1,
          );
        },
      );
    },
  );
});
