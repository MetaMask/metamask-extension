import { strict as assert } from 'assert';
import { Suite } from 'mocha';
// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import WebSocketRegistry from '../../websocket/registry';
import { ACCOUNT_ACTIVITY_WS_PORT } from '../../websocket/account-activity-mocks';
import { WEBSOCKET_SERVICES } from '../../websocket/constants';
import { sendAndReceive, waitForNextMessage } from '../../websocket/utils';

describe('AccountActivity WebSocket Mock Infrastructure', function (this: Suite) {
  it('mock server responds to subscribe with correct requestId correlation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const serverInstance = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.accountActivity,
        );
        assert.ok(
          serverInstance.getServer(),
          'AccountActivity WebSocket server should be running',
        );

        const ws = new WebSocket(`ws://localhost:${ACCOUNT_ACTIVITY_WS_PORT}`);

        const sessionMsg = await waitForNextMessage(ws);

        assert.equal(
          sessionMsg.event,
          'session-created',
          'First message should be session-created',
        );
        const sessionData = sessionMsg.data as Record<string, unknown>;
        assert.ok(
          sessionData.sessionId,
          'session-created should include a sessionId',
        );

        const testRequestId = 'test-request-123';
        const testChannels = ['account-activity.v1.eip155:0:0xTestAddress'];

        const response = await sendAndReceive(ws, {
          event: 'subscribe',
          data: {
            requestId: testRequestId,
            channels: testChannels,
          },
        });

        const responseData = response.data as Record<string, unknown>;
        assert.equal(
          responseData.requestId,
          testRequestId,
          'Response should echo back the same requestId',
        );
        assert.ok(
          responseData.subscriptionId,
          'Response should include a subscriptionId',
        );
        assert.deepEqual(
          responseData.succeeded,
          testChannels,
          'Response should list succeeded channels',
        );

        const systemNotification = await waitForNextMessage(ws);

        assert.equal(
          systemNotification.event,
          'system-notification',
          'Should receive a system-notification after subscribe',
        );
        assert.equal(
          systemNotification.channel,
          'system-notifications.v1.account-activity.v1',
          'System notification should be on system-notifications.v1.account-activity.v1 channel',
        );

        const notificationData = systemNotification.data as Record<
          string,
          unknown
        >;
        assert.ok(
          Array.isArray(notificationData.chainIds),
          'System notification should contain chainIds array',
        );
        assert.equal(
          notificationData.status,
          'up',
          'Chains should be reported as up',
        );

        const unsubRequestId = 'test-unsub-456';
        const unsubResponse = await sendAndReceive(ws, {
          event: 'unsubscribe',
          data: {
            requestId: unsubRequestId,
            subscription: responseData.subscriptionId,
            channels: testChannels,
          },
        });

        const unsubData = unsubResponse.data as Record<string, unknown>;
        assert.equal(
          unsubData.requestId,
          unsubRequestId,
          'Unsubscribe response should echo back requestId',
        );
      },
    );
  });
});
