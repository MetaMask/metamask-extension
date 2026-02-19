import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import LocalWebSocketServer from '../../websocket-server';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

type WebSocketMessageEventLike = {
  data: unknown;
};

type WebSocketLike = {
  readyState: number;
  send(message: string): void;
  close(): void;
  addEventListener(
    type: 'open' | 'message' | 'error',
    listener: (event: WebSocketMessageEventLike) => void,
  ): void;
};

type WebSocketConstructorLike = new (url: string) => WebSocketLike;

type GlobalWebSocketContainer = {
  hyperliquidWsForE2E?: WebSocketLike;
  [key: string]: unknown;
};

describe('Perps (Hyperliquid) Web Socket', function (this: Suite) {
  it('opens a websocket connection and receives mocked allMids data', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const initialConnectionCount =
          LocalWebSocketServer.getServerInstance().getWebsocketConnectionCount();

        // Open a non-extension page to avoid LavaMoat scuttling restrictions
        // in the extension UI context.
        await driver.openNewPage('about:blank');

        // Open WS but keep it open until we assert connection count increases.
        await openHyperliquidWebSocket(driver);
        await waitForWebsocketConnectionCountToIncrease(
          driver,
          initialConnectionCount,
        );

        const allMidsMessage =
          await subscribeAllMidsAndWaitForFirstUpdate(driver);

        assert.equal(
          allMidsMessage?.channel,
          'allMids',
          `Expected channel "allMids" but got ${String(allMidsMessage?.channel)}`,
        );
        assert.ok(
          allMidsMessage?.data?.mids?.ETH,
          'Expected allMids message to include ETH mid price',
        );
      },
    );
  });
});

async function openHyperliquidWebSocket(driver: Driver): Promise<void> {
  await driver.executeScript(() => {
    const globalObj = globalThis as unknown as GlobalWebSocketContainer;
    const WebSocketCtor = globalObj.WebSocket as
      | WebSocketConstructorLike
      | undefined;
    if (!WebSocketCtor) {
      throw new Error('WebSocket is not available in this context');
    }

    const OPEN = 1;

    if (globalObj.hyperliquidWsForE2E?.readyState === OPEN) {
      return;
    }

    globalObj.hyperliquidWsForE2E = new WebSocketCtor(
      'wss://api.hyperliquid.xyz/ws',
    );

    return new Promise<void>((resolve, reject) => {
      const ws = globalObj.hyperliquidWsForE2E;
      if (!ws) {
        reject(new Error('Failed to create Hyperliquid WebSocket'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(
          new Error('Timed out waiting for Hyperliquid WebSocket to open'),
        );
      }, 5000);

      ws.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve();
      });

      ws.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('Hyperliquid WebSocket error'));
      });
    });
  });
}

async function subscribeAllMidsAndWaitForFirstUpdate(
  driver: Driver,
): Promise<{ channel?: string; data?: { mids?: Record<string, string> } }> {
  return await driver.executeScript(() => {
    const globalObj = globalThis as unknown as GlobalWebSocketContainer;
    const OPEN = 1;

    const ws = globalObj.hyperliquidWsForE2E;
    if (!ws || ws.readyState !== OPEN) {
      throw new Error('Hyperliquid WebSocket is not open');
    }

    const subscribeMessage = JSON.stringify({
      method: 'subscribe',
      subscription: { type: 'allMids' },
    });

    ws.send(subscribeMessage);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        globalObj.hyperliquidWsForE2E = undefined;
        reject(new Error('Timed out waiting for Hyperliquid allMids message'));
      }, 5000);

      ws.addEventListener('message', (event) => {
        const raw = String(event.data);

        // The local WS server echoes client messages; ignore those.
        if (raw.includes('"method":"subscribe"')) {
          return;
        }

        const parsed = JSON.parse(raw);
        if (parsed?.channel !== 'allMids') {
          return;
        }

        clearTimeout(timeout);
        ws.close();
        globalObj.hyperliquidWsForE2E = undefined;
        resolve(parsed);
      });

      ws.addEventListener('error', () => {
        clearTimeout(timeout);
        ws.close();
        globalObj.hyperliquidWsForE2E = undefined;
        reject(
          new Error('Hyperliquid WebSocket error while waiting for allMids'),
        );
      });
    });
  });
}

async function waitForWebsocketConnectionCountToIncrease(
  driver: Driver,
  baselineCount: number,
): Promise<void> {
  let connectionCount = baselineCount;
  await driver.wait(async () => {
    connectionCount =
      LocalWebSocketServer.getServerInstance().getWebsocketConnectionCount();
    return connectionCount > baselineCount;
  }, 10000);

  assert.ok(
    connectionCount > baselineCount,
    `Expected websocket connection count to increase above ${baselineCount}, but found ${connectionCount}`,
  );
}
