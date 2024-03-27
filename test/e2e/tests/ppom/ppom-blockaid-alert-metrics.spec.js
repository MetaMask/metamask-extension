const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const { mockServerJsonRpc } = require('../../mock-server-json-rpc');
const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  withFixtures,
  getEventPayloads,
  switchToNotificationWindow,
} = require('../../helpers');

const selectedAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const selectedAddressWithoutPrefix = '5cfe73b6021e818b776b421b1c4db2474086a7e1';

const CONTRACT_ADDRESS = {
  BalanceChecker: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
  BUSD: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
  BUSDImplementation: '0x2a3f1a37c04f82aa274f5353834b2d002db91015',
  OffChainOracle: '0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b',
};
async function mockInfuraWithMaliciousResponses(mockServer) {
  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    [
      'eth_call',
      {
        methodResultVariant: 'balanceChecker',
        params: [{ to: CONTRACT_ADDRESS.BalanceChecker }],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'offchainOracle',
        params: [{ to: CONTRACT_ADDRESS.OffChainOracle }],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'balance',
        params: [
          {
            accessList: [],
            data: `0x70a08231000000000000000000000000${selectedAddressWithoutPrefix}`,
            to: CONTRACT_ADDRESS.BUSD,
          },
        ],
      },
    ],
    [
      'eth_call',
      {
        params: [
          {
            accessList: [],
            data: '0x06fdde03',
            to: CONTRACT_ADDRESS.WrappedEther,
            type: '0x02',
          },
        ],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'symbol',
        params: [
          {
            accessList: [],
            data: '0x95d89b41',
            to: CONTRACT_ADDRESS.WrappedEther,
            type: '0x02',
          },
          '0x11a7e9a',
        ],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'decimals',
        params: [
          {
            accessList: [],
            data: '0x313ce567',
            to: CONTRACT_ADDRESS.WrappedEther,
            type: '0x02',
          },
          '0x11a7e9a',
        ],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'getRateWithThreshold',
        params: [
          {
            accessList: [],
            data: `0x6744d6c7000000000000000000000000${CONTRACT_ADDRESS.WrappedEther}000000000000000000000000${CONTRACT_ADDRESS.TetherToken}00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000063`,
            to: CONTRACT_ADDRESS.OffchainOracle,
            type: '0x02',
          },
          '0x11a7e9a',
        ],
      },
    ],
    ['eth_estimateGas'],
    ['eth_feeHistory'],
    ['eth_gasPrice'],
    ['eth_getBalance'],
    ['eth_getBlockByNumber'],
    [
      'eth_getCode',
      {
        methodResultVariant: 'BUSD',
        params: [CONTRACT_ADDRESS.BUSD],
      },
    ],
    ['eth_getTransactionCount'],
  ]);

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [{ accessList: [], data: '0x00000000' }],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            calls: [
              {
                error: 'execution reverted',
                from: CONTRACT_ADDRESS.BUSD,
                gas: '0x1d55c2cb',
                gasUsed: '0x39c',
                input: '0x00000000',
                to: CONTRACT_ADDRESS.BUSDImplementation,
                type: 'DELEGATECALL',
                value: '0x0',
              },
            ],
            error: 'execution reverted',
            from: '0x0000000000000000000000000000000000000000',
            gas: '0x1dcd6500',
            gasUsed: '0x721e',
            input: '0x00000000',
            to: CONTRACT_ADDRESS.BUSD,
            type: 'CALL',
            value: '0x0',
          },
        },
      };
    });

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [
        {
          data: '0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff',
        },
      ],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            calls: [
              {
                from: CONTRACT_ADDRESS.BUSD,
                gas: '0x291ee',
                gasUsed: '0x79bb',
                input:
                  '0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff',
                logs: [
                  {
                    address: CONTRACT_ADDRESS.BUSD,
                    data: '0x000000000000000000000000000000000000000000000000ffffffffffffffff',
                    topics: [
                      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
                      `0x000000000000000000000000${selectedAddressWithoutPrefix}`,
                      '0x000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6',
                    ],
                  },
                ],
                output:
                  '0x0000000000000000000000000000000000000000000000000000000000000001',
                to: CONTRACT_ADDRESS.BUSDImplementation,
                type: 'DELEGATECALL',
                value: '0x0',
              },
            ],
            from: selectedAddress,
            gas: '0x30d40',
            gasUsed: '0xeac5',
            input:
              '0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff',
            output:
              '0x0000000000000000000000000000000000000000000000000000000000000001',
            to: CONTRACT_ADDRESS.BUSD,
            type: 'CALL',
            value: '0x0',
          },
        },
      };
    });

  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'Transaction Added',
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
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should capture metrics when security alerts is shown', async function () {
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
        await driver.clickElement('#maliciousApprovalButton');

        // Wait for confirmation pop-up
        await switchToNotificationWindow(driver, 3);

        // Wait for confirmation pop-up to close
        await driver.clickElement({ text: 'Reject', tag: 'button' });

        const windowHandles = await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDApp,
          windowHandles,
        );

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousPermit');

        // Wait for confirmation pop-up
        await switchToNotificationWindow(driver, 3);

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
            security_alert_reason: 'approval_farming',
            security_alert_response: 'Malicious',
            ui_customizations: ['flagged_as_malicious'],
            ppom_eth_chainId_count: 1,
            ppom_eth_getBlockByNumber_count: 1,
            ppom_debug_traceCall_count: 3,
            ppom_eth_call_count: 1,
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
            ppom_eth_call_count: events[0].properties.ppom_eth_call_count,
          },
          userId: events[0].userId,
          type: events[0].type,
        };

        const signatureRequestedEvent = {
          event: 'Signature Requested',
          properties: {
            signature_type: 'eth_signTypedData_v4',
            security_alert_response: 'Malicious',
            security_alert_reason: 'permit_farming',
            ppom_eth_chainId_count: 1,
            ppom_eth_getBlockByNumber_count: 1,
            ppom_eth_call_count: 1,
            ppom_debug_traceCall_count: 1,
          },
          userId: 'fake-metrics-id',
          type: 'track',
        };

        const matchSignatureRequestedEvent = {
          event: events[1].event,
          properties: {
            signature_type: events[1].properties.signature_type,
            security_alert_response:
              events[1].properties.security_alert_response,
            security_alert_reason: events[1].properties.security_alert_reason,
            ppom_eth_chainId_count: events[1].properties.ppom_eth_chainId_count,
            ppom_eth_getBlockByNumber_count:
              events[1].properties.ppom_eth_getBlockByNumber_count,
            ppom_eth_call_count: events[1].properties.ppom_eth_call_count,
            ppom_debug_traceCall_count:
              events[1].properties.ppom_debug_traceCall_count,
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
