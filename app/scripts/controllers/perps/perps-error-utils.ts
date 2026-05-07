/**
 * Returns true when `err` (or any error in its `cause` chain) is a benign
 * WebSocket disconnect side-effect of our own `PerpsController.disconnect()`.
 *
 * Two error shapes are treated as benign:
 *
 * 1. `ReconnectingWebSocketError { code: 'TERMINATED_BY_USER' }` (from
 * `@nktkas/rews`) — emitted when `close()` is called explicitly.  Typically
 * surfaces as `WebSocketRequestError { cause: ReconnectingWebSocketError }`.
 *
 * 2. `WebSocketRequestError { message: 'WebSocket connection closed' }` (from
 * `@nktkas/hyperliquid` `_postRequest.js`) — thrown when the socket's
 * `close`/`error` event drains the pending request queue mid-disconnect.
 *
 * Neither indicates a real connectivity problem; both are race side-effects of
 * account switches where `disconnect()` fires while a request is in-flight.
 * The chain walk (max 5 levels) handles nested `cause` references.
 *
 * @param err - The value thrown.
 */
export function isBenignDisconnectError(err: unknown): boolean {
  let cur: unknown = err;
  for (let i = 0; cur !== null && cur !== undefined && i < 5; i += 1) {
    const e = cur as {
      name?: unknown;
      code?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    // Shape 1a: ReconnectingWebSocketError with explicit TERMINATED_BY_USER code
    if (e?.code === 'TERMINATED_BY_USER') {
      return true;
    }
    // Shape 1b: ReconnectingWebSocketError without any code (defensive fallback —
    // explicit close is the only expected path from our own disconnect())
    if (e?.name === 'ReconnectingWebSocketError' && !e?.code) {
      return true;
    }
    // Shape 2: in-flight request queue drained when socket closes
    // Hard-coded message produced at exactly one call site in _postRequest.js
    if (
      e?.name === 'WebSocketRequestError' &&
      e?.message === 'WebSocket connection closed'
    ) {
      return true;
    }
    cur = e?.cause;
  }
  return false;
}
