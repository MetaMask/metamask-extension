/**
 * Maintains a WebSocket connection to the dev server, reconnecting with
 * exponential backoff, and hands every parsed message to `onMessage`. Once
 * `isDone()` returns true (the client has begun a reload), messages stop
 * being dispatched and a closed socket is no longer reconnected — the
 * teardown is expected.
 *
 * @param url - The WebSocket URL to connect to.
 * @param isDone - Whether the client is finished with the connection.
 * @param onMessage - Receives each message's type and data, and the socket it
 * arrived on.
 * @param maxReconnectDelayMs - The ceiling for the reconnection backoff.
 */
export function connectToDevServer(
  url: string,
  isDone: () => boolean,
  onMessage: (type: string, data: unknown, socket: WebSocket) => void,
  maxReconnectDelayMs: number = 5000,
): void {
  /**
   * Schedules a reconnection attempt with exponential backoff.
   *
   * @param previousAttempt - The number of the attempt that just failed.
   */
  function scheduleReconnect(previousAttempt: number): void {
    const attempt = previousAttempt + 1;
    const delay = Math.min(2 ** attempt * 100, maxReconnectDelayMs);
    setTimeout(() => connect(attempt), delay);
  }

  /**
   * Opens the WebSocket and dispatches its messages.
   *
   * @param reconnectAttempt - The current reconnection attempt count (0 on
   * first connect).
   */
  function connect(reconnectAttempt: number): void {
    let attempt = reconnectAttempt;
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      scheduleReconnect(attempt);
      return;
    }

    socket.addEventListener('open', () => {
      attempt = 0;
    });

    socket.addEventListener('message', (event: MessageEvent) => {
      if (isDone() || typeof event.data !== 'string') {
        return;
      }
      let message: { type?: string; data?: unknown };
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (typeof message.type === 'string') {
        onMessage(message.type, message.data, socket);
      }
    });

    // A failed connection also fires `close` (after its `error`), so this
    // handler covers both connection failures and later disconnects.
    socket.addEventListener('close', () => {
      if (!isDone()) {
        scheduleReconnect(attempt);
      }
    });
  }

  connect(0);
}
