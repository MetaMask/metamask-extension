import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import {
  assertInAnyOrder,
  getEventPayloads,
  withFixtures,
} from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { MOCK_ANALYTICS_ID } from '../../constants';
import { login } from '../../page-objects/flows/login.flow';
import { sendRedesignedTransactionToAddress } from '../../page-objects/flows/send-transaction.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

/**
 * Mocks the Segment API for the events we expect to see in this test. After
 * the migration of sensitive transaction-event properties to the public
 * properties bag, the transaction metrics builders no longer emit any
 * sensitive properties for a simple-send flow, so the Anon variants of
 * Submitted/Added/Approved/Finalized must not be mocked — otherwise
 * `getEventPayloads` would block waiting for requests that never arrive.
 *
 * Do not use the constants from the metrics constants files, because if these
 * change we want a strong indicator to our data team that the shape of data
 * will change.
 *
 * @param mockServer
 */
async function testSpecificMock(mockServer: Mockttp) {
  // Mock feature flags - not included in returned array so getEventPayloads won't wait for it
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
  ];
}

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

type EventPayload = {
  messageId: string;
  userId?: string;
  anonymousId?: string;
  properties: Record<string, unknown>;
};

const hasNonEmptyMessageId = (payload: EventPayload): boolean =>
  typeof payload.messageId === 'string' && payload.messageId.length > 0;

const eventHasUserIdWithoutAnonymousId = (payload: EventPayload): boolean =>
  typeof payload.userId === 'string' &&
  typeof payload.anonymousId === 'undefined';

describe('Transaction Finalized Event', function (this: Suite) {
  it('Successfully tracked when sending a transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .withAppStateController({
            pna25Acknowledged: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);

        // TODO: Update Test when Multichain Send Flow is added
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '2',
        });

        // Get the transaction hash from the activity list
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedTxNumberDisplayedInActivity(1);
        await activityTab.clickOnActivity(1);
        await activityTab.clickCopyTransactionHashButton();
        const txHash = await driver.getClipboardContent();

        const events = await getEventPayloads(driver, mockedEndpoints);

        const transactionSubmittedWithoutSensitivePropertiesAssertions = [
          hasNonEmptyMessageId,
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

        const transactionFinalizedAssertions = [
          hasNonEmptyMessageId,
          eventHasUserIdWithoutAnonymousId,
          (payload: EventPayload) =>
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
            typeof payload.properties?.completion_time === 'string',
        ];

        const [event1, event2] = events;

        const eventsWithHash = events.filter(
          (event) => event?.properties?.transaction_hash,
        );
        assert.ok(
          eventsWithHash.length === 1,
          `Expected 1 event with transaction_hash, got ${eventsWithHash.length}`,
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
            [event1, event2],
            [
              transactionSubmittedWithoutSensitivePropertiesAssertions,
              transactionFinalizedAssertions,
            ],
          ),
          'Events should match all assertion arrays',
        );
      },
    );
  });
});
