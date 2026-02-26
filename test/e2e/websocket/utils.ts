// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';

/**
 * Send a JSON message over a WebSocket and resolve with the first response.
 *
 * @param ws - The WebSocket connection
 * @param message - The message to send
 * @param timeoutMs - Maximum time to wait for a response (default 5 000 ms)
 * @returns The parsed JSON response
 */
export function sendAndReceive(
  ws: WebSocket,
  message: Record<string, unknown>,
  timeoutMs = 5000,
): Promise<Record<string, unknown>> {
  const messageJson = JSON.stringify(message);

  return new Promise((resolve, reject) => {
    let settled = false;

    const handler = (data: { toString(): string }) => {
      if (settled) {
        return;
      }
      settled = true;
      ws.off('message', handler);
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(data.toString()) as Record<string, unknown>;
      } catch (err) {
        reject(err);
        return;
      }
      resolve(parsed);
    };

    setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      ws.off('message', handler);
      reject(new Error('Timed out waiting for WebSocket response'));
    }, timeoutMs);

    ws.on('message', handler);
    ws.send(messageJson);
  });
}

/**
 * Wait for the next message on a WebSocket connection.
 *
 * @param ws - The WebSocket connection
 * @param timeoutMs - Maximum time to wait (default 5 000 ms)
 * @returns The parsed JSON message
 */
export function waitForNextMessage(
  ws: WebSocket,
  timeoutMs = 5000,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Timed out waiting for WebSocket message')),
      timeoutMs,
    );

    const onError = (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    };

    ws.once('error', onError);
    ws.once('message', (data) => {
      clearTimeout(timeout);
      ws.off('error', onError);
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(data.toString()) as Record<string, unknown>;
      } catch (err) {
        reject(err);
        return;
      }
      resolve(parsed);
    });
  });
}
