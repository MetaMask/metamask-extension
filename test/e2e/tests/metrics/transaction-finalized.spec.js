/* eslint-disable no-useless-escape */
const { isEqual, omit } = require('lodash');
const {
  defaultGanacheOptions,
  withFixtures,
  sendTransaction,
  getEventPayloads,
  assertInAnyOrder,
  logInWithBalanceValidation,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

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
            event: 'Transaction Submitted Anon',
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
            event: 'Transaction Finalized Anon',
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

/**
 * Assert that the event names begin with the appropriate prefixes. Even
 * finalized events begin with transaction-submitted because they start as
 * event fragments created when the transaction is submitted.
 *
 * @param {object} payload
 */
const messageIdStartsWithTransactionSubmitted = (payload) =>
  payload.messageId.startsWith('transaction-submitted');

/**
 * Assert that the events with sensitive properties should have messageIds
 * ending in 0x000 this is important because otherwise the events are seen as
 * duplicates in segment
 *
 * @param {object} payload
 */
const messageIdEndsWithZeros = (payload) => payload.messageId.endsWith('0x000');

/**
 * Assert that the events with sensitive data do not contain a userId (the
 * random anonymous id generated when a user opts into metametrics)
 *
 * @param {object} payload
 */
const eventDoesNotIncludeUserId = (payload) =>
  typeof payload.userId === 'undefined';

const eventHasUserIdWithoutAnonymousId = (payload) =>
  typeof payload.userId === 'string' &&
  typeof payload.anonymousId === 'undefined';

/**
 * Assert that the events with sensitive data have anonymousId set to
 * 0x0000000000000000 which is our universal anonymous record
 *
 * @param {object} payload
 */
const eventHasZeroAddressAnonymousId = (payload) =>
  payload.anonymousId === '0x0000000000000000';

describe('Transaction Finalized Event', function () {
  it('Successfully tracked when sending a transaction @no-mmi', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        // TODO: Update Test when Multichain Send Flow is added
        if (process.env.MULTICHAIN) {
          return;
        }
        await sendTransaction(driver, RECIPIENT, '2.0');

        const events = await getEventPayloads(driver, mockedEndpoints);

        const transactionSubmittedWithSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          messageIdEndsWithZeros,
          eventDoesNotIncludeUserId,
          eventHasZeroAddressAnonymousId,
          (payload) =>
            isEqual(omit(payload.properties, ['first_seen']), {
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
            }),
        ];

        const transactionSubmittedWithoutSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          eventHasUserIdWithoutAnonymousId,
          (payload) =>
            isEqual(payload.properties, {
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
              status: 'submitted',
            }),
        ];

        await driver.delay(10000);

        const transactionFinalizedWithSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          messageIdEndsWithZeros,
          eventDoesNotIncludeUserId,
          eventHasZeroAddressAnonymousId,
          (payload) =>
            isEqual(
              omit(payload.properties, ['first_seen', 'completion_time']),
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
            ),
        ];

        const transactionFinalizedWithoutSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          eventHasUserIdWithoutAnonymousId,
          (payload) =>
            isEqual(payload.properties, {
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
              status: 'confirmed',
            }),
        ];

        const [event1, event2, event3, event4] = events;

        assertInAnyOrder(
          [event1, event2, event3, event4],
          [
            transactionSubmittedWithSensitivePropertiesAssertions,
            transactionSubmittedWithoutSensitivePropertiesAssertions,
            transactionFinalizedWithSensitivePropertiesAssertions,
            transactionFinalizedWithoutSensitivePropertiesAssertions,
          ],
        );
      },
    );
  });
});
