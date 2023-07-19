/* eslint-disable no-useless-escape */
const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  sendTransaction,
  getEventPayloads,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

/**
 * mocks the segment api multiple times for specific payloads that we expect to
 * see when these tests are run. In this case we are looking for
 * 'Transaction Submitted' and 'Transaction Finalized'. In addition on the
 * first event of each series we require a field that should only appear in the
 * anonymized events so that we can guarantee order of seenRequests and can
 * properly make assertions. Do not use the constants from the metrics
 * constants files, because if these change we want a strong indicator to our
 * data team that the shape of data will change.
 *
 * @param {import('mockttp').Mockttp} mockServer
 * @returns {Promise<import('mockttp/dist/pluggable-admin').MockttpClientResponse>[]}
 */
async function mockSegment(mockServer) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'Transaction Submitted',
            properties: { status: 'submitted' },
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
            event: 'Transaction Submitted',
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
            event: 'Transaction Finalized',
            properties: { status: 'confirmed' },
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
            event: 'Transaction Finalized',
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

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

describe('Transaction Finalized Event', function () {
  it('Successfully tracked when sending a transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);

        await sendTransaction(driver, RECIPIENT, '2.0');

        const events = await getEventPayloads(driver, mockedEndpoints);
        // The order of these events is ensured by the mockSegment function
        // which requires that the first, and third (0, 2 indexes) have the
        // status property, which will only appear on the anonymous events.
        const transactionSubmittedNoMMId = events[0];
        const transactionSubmittedWithMMId = events[1];
        const transactionFinalizedNoMMId = events[2];
        const transactionFinalizedWithMMId = events[3];

        // Assert doesn't have generic matchers so we delete these timestamp related properties.
        // If we switch to a different assertion library we can use generic matchers in the future.
        delete transactionSubmittedNoMMId.properties.first_seen;
        delete transactionFinalizedNoMMId.properties.first_seen;
        delete transactionFinalizedNoMMId.properties.completion_time;

        // Assert that the event names begin with the appropriate prefixes. Even finalized events begin with transaction-submitted
        // because they start as event fragments created when the transaction is submitted.
        assert.ok(
          transactionSubmittedNoMMId.messageId.startsWith(
            'transaction-submitted',
          ),
          `Transaction Submitted event with sensitive properties has messageId \"${transactionSubmittedNoMMId.messageId}\" does not have a messageId beginning with \"transaction-submitted\"`,
        );

        assert.ok(
          transactionFinalizedNoMMId.messageId.startsWith(
            'transaction-submitted',
          ),
          `Transaction Finalized event with sensitive properties has messageId \"${transactionFinalizedNoMMId.messageId}\" that does not begin with \"transaction-submitted\"`,
        );

        assert.ok(
          transactionSubmittedWithMMId.messageId.startsWith(
            'transaction-submitted',
          ),
          `Transaction Submitted event has messageId \"${transactionSubmittedWithMMId.messageId}\" that does not begin with \"transaction-submitted\"`,
        );

        assert.ok(
          transactionFinalizedWithMMId.messageId.startsWith(
            'transaction-submitted',
          ),
          `Transaction Finalized event has messageID \"${transactionFinalizedWithMMId.messageId}\" that does not begin with \"transaction-submitted\"`,
        );

        // Assert that the events with sensitive properties should have messageIds ending in 0x000
        // This is important because otherwise the events are seen as duplicates in segment

        assert.ok(
          transactionSubmittedNoMMId.messageId.endsWith('0x000'),
          `Transaction Submitted event with sensitive properties has messageId \"${transactionSubmittedNoMMId.messageId}\" that does not end in \"0x000\" to differentiate it from the event that does not include sensitive data.`,
        );

        assert.ok(
          transactionFinalizedNoMMId.messageId.endsWith('0x000'),
          `Transaction Finalized event with sensitive properties has messageID \"${transactionFinalizedNoMMId.messageId}\" that does not end in \"0x000\" to differentiate it from the event that does not include sensitive data.`,
        );

        // Assert that transaction finalized events contain '-success-' in their messageId
        assert.ok(
          transactionFinalizedWithMMId.messageId.includes('-success-'),
          `Transaction Finalized event has messageId \"${transactionFinalizedWithMMId.messageId}\" that does not contain "-success-"`,
        );

        assert.ok(
          transactionFinalizedNoMMId.messageId.includes('-success-'),
          `Transaction Finalized event with sensitive properties has messageID \"${transactionFinalizedNoMMId.messageId}\" that does not contain "-success-"`,
        );

        // Assert that the events with sensitive data do not contain a userId (the random anonymous id generated when a user opts into metametrics)
        assert.ok(
          typeof transactionSubmittedNoMMId.userId === 'undefined',
          'Transaction Submitted event with sensitive properties has a userId supplied when it should only have the anonymousId',
        );
        assert.ok(
          typeof transactionFinalizedNoMMId.userId === 'undefined',
          'Transaction Finalized event with sensitive properties has a userId supplied when it should only have the anonymousId',
        );

        // Assert that the events with sensitive data have anonymousId set to 0x0000000000000000 which is our universal anonymous record
        assert.ok(
          transactionSubmittedNoMMId.anonymousId === '0x0000000000000000',
          'Transaction Submitted event with sensitive properties has an anonymousId that does not match our universal anonymous id of 0x0000000000000000',
        );
        assert.ok(
          transactionFinalizedNoMMId.anonymousId === '0x0000000000000000',
          'Transaction Finalized event with sensitive properties has an anonymousId that does not match our universal anonymous id of 0x0000000000000000',
        );

        // Assert that our events without sensitive data have a userId but no anonymousId
        assert.ok(
          typeof transactionSubmittedWithMMId.userId === 'string' &&
            typeof transactionSubmittedWithMMId.anonymousId === 'undefined',
          'Transaction Submitted event without sensitive properties should only have a userId specified, and no anonymousId',
        );
        assert.ok(
          typeof transactionFinalizedWithMMId.userId === 'string' &&
            typeof transactionFinalizedWithMMId.anonymousId === 'undefined',
          'Transaction Finalized event without sensitive properties should only have a userId specified, and no anonymousId',
        );

        // Assert on the properties

        assert.deepStrictEqual(
          transactionSubmittedNoMMId.properties,
          {
            status: 'submitted',
            transaction_envelope_type: 'legacy',
            gas_limit: '0x5208',
            gas_price: '2',
            default_gas: '0.000021',
            default_gas_price: '2',
            chain_id: '0x539',
            referrer: 'metamask',
            source: 'user',
            network: '1337',
            eip_1559_version: '0',
            gas_edit_type: 'none',
            gas_edit_attempted: 'none',
            account_type: 'MetaMask',
            device_model: 'N/A',
            asset_type: 'NATIVE',
            token_standard: 'NONE',
            transaction_type: 'simpleSend',
            transaction_speed_up: false,
            ui_customizations: null,
            category: 'Transactions',
            locale: 'en',
            environment_type: 'background',
          },
          'Transaction Submitted event with sensitive properties does not match the expected payload',
        );
        assert.deepStrictEqual(
          transactionSubmittedWithMMId.properties,
          {
            chain_id: '0x539',
            referrer: 'metamask',
            source: 'user',
            network: '1337',
            eip_1559_version: '0',
            gas_edit_type: 'none',
            gas_edit_attempted: 'none',
            account_type: 'MetaMask',
            device_model: 'N/A',
            asset_type: 'NATIVE',
            token_standard: 'NONE',
            transaction_type: 'simpleSend',
            transaction_speed_up: false,
            ui_customizations: null,
            category: 'Transactions',
            locale: 'en',
            environment_type: 'background',
          },
          'Transaction Submitted event without sensitive properties does not match the expected payload',
        );

        assert.deepStrictEqual(
          transactionFinalizedNoMMId.properties,
          {
            status: 'confirmed',
            transaction_envelope_type: 'legacy',
            gas_limit: '0x5208',
            gas_price: '2',
            default_gas: '0.000021',
            default_gas_price: '2',
            chain_id: '0x539',
            referrer: 'metamask',
            source: 'user',
            network: '1337',
            eip_1559_version: '0',
            gas_edit_type: 'none',
            gas_edit_attempted: 'none',
            account_type: 'MetaMask',
            device_model: 'N/A',
            asset_type: 'NATIVE',
            token_standard: 'NONE',
            transaction_type: 'simpleSend',
            transaction_speed_up: false,
            ui_customizations: null,
            gas_used: '5208',
            category: 'Transactions',
            locale: 'en',
            environment_type: 'background',
          },
          'Transaction Finalized event with sensitive properties does not match the expected payload',
        );
        assert.deepStrictEqual(
          transactionFinalizedWithMMId.properties,
          {
            chain_id: '0x539',
            referrer: 'metamask',
            source: 'user',
            network: '1337',
            eip_1559_version: '0',
            gas_edit_type: 'none',
            gas_edit_attempted: 'none',
            account_type: 'MetaMask',
            device_model: 'N/A',
            asset_type: 'NATIVE',
            token_standard: 'NONE',
            transaction_type: 'simpleSend',
            transaction_speed_up: false,
            ui_customizations: null,
            category: 'Transactions',
            locale: 'en',
            environment_type: 'background',
          },
          'Transaction Finalized event without sensitive properties does not match the expected payload',
        );
      },
    );
  });
});
