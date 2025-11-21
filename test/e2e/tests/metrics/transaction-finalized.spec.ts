import { isEqual, omit } from 'lodash';
import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import {
  assertInAnyOrder,
  getEventPayloads,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { MOCK_META_METRICS_ID } from '../../constants';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { sendRedesignedTransactionToAddress } from '../../page-objects/flows/send-transaction.flow';
import { validateTransactionFinalized } from './helpers/validate-transaction-finalized';
import { validateTransactionFinalizedAnon } from './helpers/validate-transaction-finalized-anon';
import { validateTransactionSubmittedAnon } from './helpers/validate-transaction-submitted-anon';
import { strict as assert } from 'assert';
import { validateTransactionSubmitted } from './helpers/validate-transaction-submitted';

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
 * duplicates in segment - (used for Anonymized Events)
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

        const transactionSubmittedAnonEvent = events.find(event => event.event === 'Transaction Submitted Anon');
        validateTransactionSubmittedAnon(transactionSubmittedAnonEvent, [
          (transactionSubmittedEvent: EventPayload) => assert.equal(messageIdStartsWithTransactionSubmitted(transactionSubmittedEvent), true),
          (transactionSubmittedEvent: EventPayload) => assert.equal(messageIdEndsWithZeros(transactionSubmittedEvent), true),
          (transactionSubmittedEvent: EventPayload) => assert.equal(eventDoesNotIncludeUserId(transactionSubmittedEvent), true),
          (transactionSubmittedEvent: EventPayload) => assert.equal(eventHasZeroAddressAnonymousId(transactionSubmittedEvent), true),
        ]);

        const transactionSubmittedEvent = events.find(event => event.event === 'Transaction Submitted');
        validateTransactionSubmitted(transactionSubmittedEvent, [
          (transactionSubmittedEvent: EventPayload) => assert.equal(messageIdStartsWithTransactionSubmitted(transactionSubmittedEvent), true),
          (transactionSubmittedEvent: EventPayload) => assert.equal(eventHasUserIdWithoutAnonymousId(transactionSubmittedEvent), true),
        ]);

        await driver.delay(10000);

        const transactionFinalizedEvent = events.find(event => event.event === 'Transaction Finalized');
        validateTransactionFinalized(transactionFinalizedEvent, [(transactionFinalizedEvent: EventPayload) =>
          isEqual(
            omit(transactionFinalizedEvent.properties, ['first_seen', 'completion_time']),
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
          (transactionFinalizedEvent: EventPayload) => assert.strictEqual(messageIdStartsWithTransactionSubmitted(transactionFinalizedEvent), true),
          (transactionFinalizedEvent: EventPayload) => assert.equal(eventHasUserIdWithoutAnonymousId(transactionFinalizedEvent), true),
        ],
        );

        const transactionFinalizedAnonEvent = events.find(event => event.event === 'Transaction Finalized Anon');
        validateTransactionFinalizedAnon(transactionFinalizedAnonEvent, [
          (transactionFinalizedEvent: EventPayload) =>
            isEqual(transactionFinalizedEvent.properties, {
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
          (transactionFinalizedEvent: EventPayload) => assert.equal(messageIdStartsWithTransactionSubmitted(transactionFinalizedEvent), true),
          (transactionFinalizedEvent: EventPayload) => assert.strictEqual(messageIdEndsWithZeros(transactionFinalizedEvent), true),
          (transactionFinalizedEvent: EventPayload) => assert.strictEqual(eventDoesNotIncludeUserId(transactionFinalizedEvent), true),
          (transactionFinalizedEvent: EventPayload) => assert.strictEqual(eventHasZeroAddressAnonymousId(transactionFinalizedEvent), true),
        ],
        );
      },
    );
  });
});
