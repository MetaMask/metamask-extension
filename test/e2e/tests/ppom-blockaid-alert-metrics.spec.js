const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');

const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  withFixtures,
  getEventPayloads,
} = require('../helpers');

async function mockInfuraWithMaliciousResponses(mockServer) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'Transaction Added',
            properties: {
              category: 'Transactions',
              security_alert_reason: 'raw_native_token_transfer',
              security_alert_response: 'Malicious',
              ui_customizations: ['flagged_as_malicious'],
            },
          },
        ],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'Signature Requested',
            properties: {
              security_alert_response: 'Malicious',
              security_alert_reason: 'trade_order_farming',
            },
          },
        ],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Confirmation Security Alert - Blockaid @no-mmi', function () {
  it('should show security alerts for malicious requests', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockInfuraWithMaliciousResponses,
      },

      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        // Click TestDapp button for transaction
        await driver.clickElement('#maliciousRawEthButton');

        // Wait for confirmation pop-up
        let windowHandles = await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Notification,
          windowHandles,
        );

        // Wait for confirmation pop-up to close
        await driver.clickElement({ text: 'Reject', tag: 'button' });
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        // Click TestDapp button for signature
        await driver.clickElement('#maliciousTradeOrder');

        // Wait for confirmation pop-up
        windowHandles = await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Notification,
          windowHandles,
        );

        // Wait for confirmation pop-up to close
        await driver.clickElement({ text: 'Reject', tag: 'button' });
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        const events = await getEventPayloads(driver, mockedEndpoints);

        const transactionAddedEvent = {
          event: 'Transaction Added',
          properties: {
            category: 'Transactions',
            security_alert_reason: 'raw_native_token_transfer',
            security_alert_response: 'Malicious',
            ui_customizations: ['flagged_as_malicious'],
            ppom_eth_chainId_count: 1,
            ppom_eth_getBlockByNumber_count: 1,
            ppom_debug_traceCall_count: 1,
            ppom_eth_getTransactionCount_count: 1,
            ppom_eth_getBalance_count: 1,
            ppom_eth_getCode_count: 1,
          },
          userId: 'fake-metrics-id',
          type: 'track',
        };

        const matchTransactionAddedEvent = {
          event: events[0].event,
          properties: {
            category: events[0].properties.category,
            security_alert_reason: events[0].properties.security_alert_reason,
            security_alert_response:
              events[0].properties.security_alert_response,
            ui_customizations: events[0].properties.ui_customizations,
            ppom_eth_chainId_count: events[0].properties.ppom_eth_chainId_count,
            ppom_eth_getBlockByNumber_count:
              events[0].properties.ppom_eth_getBlockByNumber_count,
            ppom_debug_traceCall_count:
              events[0].properties.ppom_debug_traceCall_count,
            ppom_eth_getTransactionCount_count:
              events[0].properties.ppom_eth_getTransactionCount_count,
            ppom_eth_getBalance_count:
              events[0].properties.ppom_eth_getBalance_count,
            ppom_eth_getCode_count: events[0].properties.ppom_eth_getCode_count,
          },
          userId: events[0].userId,
          type: events[0].type,
        };

        const signatureRequestedEvent = {
          event: 'Signature Requested',
          properties: {
            security_alert_response: 'Malicious',
            security_alert_reason: 'trade_order_farming',
            ppom_eth_chainId_count: 1,
            ppom_eth_getBlockByNumber_count: 1,
            ppom_eth_call_count: 6,
          },
          userId: 'fake-metrics-id',
          type: 'track',
        };

        const matchSignatureRequestedEvent = {
          event: events[1].event,
          properties: {
            security_alert_response:
              events[1].properties.security_alert_response,
            security_alert_reason: events[1].properties.security_alert_reason,
            ppom_eth_chainId_count: events[1].properties.ppom_eth_chainId_count,
            ppom_eth_getBlockByNumber_count:
              events[1].properties.ppom_eth_getBlockByNumber_count,
            ppom_eth_call_count: events[1].properties.ppom_eth_call_count,
          },
          userId: events[1].userId,
          type: events[1].type,
        };

        assert.equal(events.length, 2);
        assert.deepEqual(transactionAddedEvent, matchTransactionAddedEvent);
        assert.deepEqual(signatureRequestedEvent, matchSignatureRequestedEvent);
      },
    );
  });
});
