import { isEqual, omit } from 'lodash';
import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import {
  assertInAnyOrder,
  getEventPayloads,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { MOCK_META_METRICS_ID } from '../../constants';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { sendRedesignedTransactionToAddress } from '../../page-objects/flows/send-transaction.flow';

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
 * @param mockServer
 */
async function mockSegment(mockServer: Mockttp) {
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

type EventPayload = {
  messageId: string;
  userId?: string;
  anonymousId?: string;
  properties: Record<string, unknown>;
};

/**
 * Assert that the event names begin with the appropriate prefixes. Even
 * finalized events begin with transaction-submitted because they start as
 * event fragments created when the transaction is submitted.
 *
 * @param payload
 */
const messageIdStartsWithTransactionSubmitted = (
  payload: EventPayload,
): boolean => payload.messageId.startsWith('transaction-submitted');

/**
 * Assert that the events with sensitive properties should have messageIds
 * ending in 0x000 this is important because otherwise the events are seen as
 * duplicates in segment
 *
 * @param payload
 */
const messageIdEndsWithZeros = (payload: EventPayload): boolean =>
  payload.messageId.endsWith('0x000');

/**
 * Assert that the events with sensitive data do not contain a userId (the
 * random anonymous id generated when a user opts into metametrics)
 *
 * @param payload
 */
const eventDoesNotIncludeUserId = (payload: EventPayload): boolean =>
  typeof payload.userId === 'undefined';

const eventHasUserIdWithoutAnonymousId = (payload: EventPayload): boolean =>
  typeof payload.userId === 'string' &&
  typeof payload.anonymousId === 'undefined';

/**
 * Assert that the events with sensitive data have anonymousId set to
 * 0x0000000000000000 which is our universal anonymous record
 *
 * @param payload
 */
const eventHasZeroAddressAnonymousId = (payload: EventPayload): boolean =>
  payload.anonymousId === '0x0000000000000000';

describe('Transaction Finalized Event', function (this: Suite) {
  it('Successfully tracked when sending a transaction', async function () {
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
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);
        // TODO: Update Test when Multichain Send Flow is added
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '2.0',
        });

        const events = await getEventPayloads(driver, mockedEndpoints);

        const transactionSubmittedWithSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          messageIdEndsWithZeros,
          eventDoesNotIncludeUserId,
          eventHasZeroAddressAnonymousId,
          (payload: EventPayload) =>
            isEqual(omit(payload.properties, ['first_seen']), {
              status: 'submitted',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              transaction_envelope_type: 'legacy',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_limit: '0x5208',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_price: '2',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              default_gas: '0.000021',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              default_gas_price: '2',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '0x539',
              referrer: 'metamask',
              source: 'user',
              network: '1337',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              eip_1559_version: '0',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_edit_type: 'none',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_edit_attempted: 'none',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              account_type: 'MetaMask',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              device_model: 'N/A',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              asset_type: 'NATIVE',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_standard: 'NONE',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              transaction_type: 'simpleSend',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              transaction_speed_up: false,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              ui_customizations: null,
              category: 'Transactions',
              locale: 'en',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              environment_type: 'background',
            }),
        ];

        const transactionSubmittedWithoutSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          eventHasUserIdWithoutAnonymousId,
          (payload: EventPayload) =>
            isEqual(payload.properties, {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '0x539',
              referrer: 'metamask',
              source: 'user',
              network: '1337',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              eip_1559_version: '0',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_edit_type: 'none',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_edit_attempted: 'none',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              account_type: 'MetaMask',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              device_model: 'N/A',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              asset_type: 'NATIVE',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_standard: 'NONE',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              transaction_type: 'simpleSend',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              transaction_speed_up: false,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              ui_customizations: null,
              category: 'Transactions',
              locale: 'en',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
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
          (payload: EventPayload) =>
            isEqual(
              omit(payload.properties, ['first_seen', 'completion_time']),
              {
                status: 'confirmed',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                transaction_envelope_type: 'legacy',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                gas_limit: '0x5208',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                gas_price: '2',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                default_gas: '0.000021',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                default_gas_price: '2',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id: '0x539',
                referrer: 'metamask',
                source: 'user',
                network: '1337',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                eip_1559_version: '0',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                gas_edit_type: 'none',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                gas_edit_attempted: 'none',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                account_type: 'MetaMask',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                device_model: 'N/A',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                asset_type: 'NATIVE',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                token_standard: 'NONE',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                transaction_type: 'simpleSend',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                transaction_speed_up: false,
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                ui_customizations: null,
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                gas_used: '5208',
                category: 'Transactions',
                locale: 'en',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                environment_type: 'background',
              },
            ),
        ];

        const transactionFinalizedWithoutSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          eventHasUserIdWithoutAnonymousId,
          (payload: EventPayload) =>
            isEqual(payload.properties, {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '0x539',
              referrer: 'metamask',
              source: 'user',
              network: '1337',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              eip_1559_version: '0',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_edit_type: 'none',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_edit_attempted: 'none',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              account_type: 'MetaMask',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              device_model: 'N/A',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              asset_type: 'NATIVE',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_standard: 'NONE',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              transaction_type: 'simpleSend',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              transaction_speed_up: false,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              ui_customizations: null,
              category: 'Transactions',
              locale: 'en',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
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
