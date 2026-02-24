import { strict as assert } from 'assert';
import { Suite } from 'mocha';
// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import LocalWebSocketServer from '../../websocket-server';

// The base WebSocket server echoes all messages back. This helper skips
// the echo and resolves with the first non-echo response from a mock handler.
function sendAndReceive(
  ws: WebSocket,
  message: Record<string, unknown>,
  timeoutMs = 5000,
): Promise<Record<string, unknown>> {
  const sentJson = JSON.stringify(message);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Timed out waiting for WebSocket response')),
      timeoutMs,
    );

    const handler = (data: { toString(): string }) => {
      const raw = data.toString();
      if (raw === sentJson) {
        return;
      }
      ws.off('message', handler);
      clearTimeout(timeout);
      resolve(JSON.parse(raw) as Record<string, unknown>);
    };

    ws.on('message', handler);
    ws.send(sentJson);
  });
}

describe('AccountActivity WebSocket Mock Infrastructure', function (this: Suite) {
  it('mock server responds to subscribe with correct requestId correlation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const serverInstance = LocalWebSocketServer.getServerInstance();
        assert.ok(
          serverInstance.getServer(),
          'WebSocket server should be running',
        );

        const ws = new WebSocket('ws://localhost:8088');

        const sessionMsg = await new Promise<Record<string, unknown>>(
          (resolve, reject) => {
            const timeout = setTimeout(
              () =>
                reject(
                  new Error('Timed out waiting for session-created message'),
                ),
              5000,
            );

            ws.on('error', reject);
            ws.once('message', (data) => {
              clearTimeout(timeout);
              resolve(JSON.parse(data.toString()) as Record<string, unknown>);
            });
          },
        );

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

        const systemNotification = await new Promise<Record<string, unknown>>(
          (resolve, reject) => {
            const timeout = setTimeout(
              () =>
                reject(new Error('Timed out waiting for system notification')),
              5000,
            );

            ws.once('message', (data) => {
              clearTimeout(timeout);
              resolve(JSON.parse(data.toString()) as Record<string, unknown>);
            });
          },
        );

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

        ws.close();
      },
    );
  });
});
