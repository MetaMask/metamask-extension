import { strict as assert } from 'assert';
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
import ActivityListPage from '../../page-objects/pages/home/activity-list';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

const isHexString = (str: unknown): boolean =>
  typeof str === 'string' && /^0x[0-9A-Fa-f]+$/u.test(str);
const isFloatString = (str: unknown): boolean =>
  typeof str === 'string' && /^[0-9.]+$/u.test(str);

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
async function testSpecificMock(mockServer: Mockttp) {
  // Mock feature flags - not included in returned array so getEventPayloads won't wait for it
  // Important: This is using the redesigned send flow
  await mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            extensionUxPna25: true,
          },
          {
            sendRedesign: {
              enabled: true,
            },
          },
        ],
      };
    });

  // Return only the segment mocks that getEventPayloads needs to track
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
          .withAppStateController({
            pna25Acknowledged: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);

        // TODO: Update Test when Multichain Send Flow is added
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '2',
        });

        // Get the transaction hash from the activity list
        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedTxNumberDisplayedInActivity(1);
        await activityList.clickOnActivity(1);
        await activityList.clickCopyTransactionHashButton();
        const txHash = await driver.getClipboardContent();
        console.log('txHash', txHash);

        const events = await getEventPayloads(driver, mockedEndpoints);
        console.log('events', events);

        const transactionSubmittedWithSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          messageIdEndsWithZeros,
          eventDoesNotIncludeUserId,
          eventHasZeroAddressAnonymousId,
          (payload: EventPayload) =>
            // Check key properties for submitted transaction with sensitive data
            payload.properties?.status === 'submitted' &&
            payload.properties?.chain_id === '0x539' &&
            payload.properties?.network === '1337' &&
            payload.properties?.referrer === 'metamask' &&
            payload.properties?.source === 'user' &&
            payload.properties?.transaction_type === 'simpleSend' &&
            payload.properties?.asset_type === 'NATIVE' &&
            payload.properties?.token_standard === 'NONE' &&
            payload.properties?.account_type === 'MetaMask' &&
            payload.properties?.transaction_speed_up === false &&
            payload.properties?.gas_edit_type === 'none' &&
            payload.properties?.gas_edit_attempted === 'none' &&
            payload.properties?.category === 'Transactions' &&
            payload.properties?.locale === 'en' &&
            payload.properties?.environment_type === 'background' &&
            // Sensitive properties (only in anon events)
            payload.properties?.transaction_envelope_type === 'fee-market' &&
            isHexString(payload.properties?.gas_limit) &&
            isFloatString(payload.properties?.default_gas),
        ];

        const transactionSubmittedWithoutSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          eventHasUserIdWithoutAnonymousId,
          (payload: EventPayload) =>
            // Check key properties for submitted transaction without sensitive data
            payload.properties?.status === 'submitted' &&
            payload.properties?.chain_id === '0x539' &&
            payload.properties?.network === '1337' &&
            payload.properties?.referrer === 'metamask' &&
            payload.properties?.source === 'user' &&
            payload.properties?.transaction_type === 'simpleSend' &&
            payload.properties?.asset_type === 'NATIVE' &&
            payload.properties?.token_standard === 'NONE' &&
            payload.properties?.account_type === 'MetaMask' &&
            payload.properties?.transaction_speed_up === false &&
            payload.properties?.gas_edit_type === 'none' &&
            payload.properties?.gas_edit_attempted === 'none' &&
            payload.properties?.category === 'Transactions' &&
            payload.properties?.locale === 'en' &&
            payload.properties?.environment_type === 'background',
        ];

        await driver.delay(10000);

        const transactionFinalizedWithSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          messageIdEndsWithZeros,
          eventDoesNotIncludeUserId,
          eventHasZeroAddressAnonymousId,
          (payload: EventPayload) =>
            // Check key properties for finalized transaction with sensitive data
            payload.properties?.status === 'confirmed' &&
            payload.properties?.chain_id === '0x539' &&
            payload.properties?.network === '1337' &&
            payload.properties?.referrer === 'metamask' &&
            payload.properties?.source === 'user' &&
            payload.properties?.transaction_type === 'simpleSend' &&
            payload.properties?.asset_type === 'NATIVE' &&
            payload.properties?.token_standard === 'NONE' &&
            payload.properties?.account_type === 'MetaMask' &&
            payload.properties?.transaction_speed_up === false &&
            payload.properties?.gas_edit_type === 'none' &&
            payload.properties?.gas_edit_attempted === 'none' &&
            payload.properties?.category === 'Transactions' &&
            payload.properties?.locale === 'en' &&
            payload.properties?.environment_type === 'background' &&
            // Sensitive properties (only in anon events)
            payload.properties?.transaction_envelope_type === 'fee-market' &&
            isHexString(payload.properties?.gas_limit) &&
            isFloatString(payload.properties?.default_gas) &&
            // Finalized-specific properties
            typeof payload.properties?.gas_used === 'string' &&
            typeof payload.properties?.completion_time === 'string',
        ];

        const transactionFinalizedWithoutSensitivePropertiesAssertions = [
          messageIdStartsWithTransactionSubmitted,
          eventHasUserIdWithoutAnonymousId,
          (payload: EventPayload) =>
            // Check key properties for finalized transaction without sensitive data
            payload.properties?.status === 'confirmed' &&
            payload.properties?.chain_id === '0x539' &&
            payload.properties?.network === '1337' &&
            payload.properties?.referrer === 'metamask' &&
            payload.properties?.source === 'user' &&
            payload.properties?.transaction_type === 'simpleSend' &&
            payload.properties?.asset_type === 'NATIVE' &&
            payload.properties?.token_standard === 'NONE' &&
            payload.properties?.account_type === 'MetaMask' &&
            payload.properties?.transaction_speed_up === false &&
            payload.properties?.gas_edit_type === 'none' &&
            payload.properties?.gas_edit_attempted === 'none' &&
            payload.properties?.category === 'Transactions' &&
            payload.properties?.locale === 'en' &&
            payload.properties?.environment_type === 'background',
        ];

        const [event1, event2, event3, event4] = events;

        // Find the finalized events (they have transaction_hash)
        const eventsWithHash = events.filter(
          (event) => event?.properties?.transaction_hash,
        );
        assert.ok(
          eventsWithHash.length === 2,
          `Expected 2 events with transaction_hash, got ${eventsWithHash.length}`,
        );

        // Verify the transaction_hash matches the actual tx hash from the activity
        assert.ok(
          eventsWithHash.every(
            (event) => event?.properties?.transaction_hash === txHash,
          ),
          `Transaction hash mismatch. Expected: ${txHash}, Got: ${eventsWithHash[0]?.properties?.transaction_hash}`,
        );

        assert.ok(
          assertInAnyOrder(
            [event1, event2, event3, event4],
            [
              transactionSubmittedWithSensitivePropertiesAssertions,
              transactionSubmittedWithoutSensitivePropertiesAssertions,
              transactionFinalizedWithSensitivePropertiesAssertions,
              transactionFinalizedWithoutSensitivePropertiesAssertions,
            ],
          ),
          'Events should match all assertion arrays',
        );
      },
    );
  });
});
