/**
 * Maintains a WebSocket connection to the dev server, reconnecting with
 * exponential backoff, and hands every parsed message to `onMessage`. Once
 * the optional `isDone()` returns true (the client has begun a reload),
 * messages stop being dispatched and a closed socket is no longer reconnected
 * — the teardown is expected.
 *
 * @param options - Connection options.
 * @param options.url - The WebSocket URL to connect to.
 * @param options.onMessage - Receives each message's type and data, and the
 * socket it arrived on.
 * @param options.isDone - Whether the client is finished with the connection.
 * @param options.maxReconnectDelayMs - The ceiling for the reconnection backoff.
 */
export function connectToDevServer({
  url,
  onMessage,
  isDone,
  maxReconnectDelayMs = 5000,
}: {
  url: string;
  onMessage: (type: string, data: unknown, socket: WebSocket) => void;
  isDone?: () => boolean;
  maxReconnectDelayMs?: number;
}): void {
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
      if (isDone?.()) {
        return;
      }
      if (typeof event.data !== 'string') {
        console.warn(
          '[webpack-dev-server] Ignoring non-string WebSocket message.',
          event.data,
        );
        return;
      }
      let message: { type?: string; data?: unknown };
      try {
        message = JSON.parse(event.data);
      } catch (error) {
        console.warn(
          '[webpack-dev-server] Ignoring malformed WebSocket message.',
          error,
        );
        return;
      }
      if (typeof message.type === 'string') {
        onMessage(message.type, message.data, socket);
      } else {
        console.warn(
          '[webpack-dev-server] Ignoring WebSocket message without a type.',
          message,
        );
      }
    });

    // A failed connection also fires `close` (after its `error`), so this
    // handler covers both connection failures and later disconnects.
    socket.addEventListener('close', () => {
      if (!isDone?.()) {
        scheduleReconnect(attempt);
      }
    });
  }

  connect(0);
}

/**
 * Starts a normal WebSocket close handshake. Resolves after the socket reports
 * `close`; the timeout keeps callers from hanging if the close event never
 * arrives.
 *
 * @param socket - The WebSocket to close.
 * @param options - Optional close behavior overrides.
 * @param options.timeoutMs - Fallback delay before resolving without a close event.
 * @param options.closureCode - The WebSocket closure code to use.
 */
export function closeSocket(
  socket: WebSocket,
  {
    timeoutMs = 1000,
    closureCode = 1000,
  }: {
    timeoutMs?: number;
    closureCode?: number;
  } = {},
): Promise<void> {
  return new Promise((resolve) => {
    let complete = false;
    const timeoutId = setTimeout(finish, timeoutMs);

    function finish(): void {
      if (complete) {
        return;
      }
      complete = true;
      clearTimeout(timeoutId);
      resolve();
    }

    socket.addEventListener('close', finish, { once: true });

    try {
      socket.close(closureCode);
    } catch {
      finish();
    }
  });
}
