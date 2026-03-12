/**
 * Generic WebSocket message mock type used by the registry and all service mocks.
 * Each service (Solana, Perps, Account Activity) defines its own default mocks;
 * this type describes the shape required by the setup functions.
 */
export type WebSocketMessageMock = {
  /** String(s) that the message should include to trigger this mock */
  messageIncludes: string | string[];
  /** The JSON response to send back, or a getter called at send time (e.g. for fresh timestamps) */
  response: object | (() => object);
  /** Delay before sending the response (in milliseconds) */
  delay?: number;
  /** Custom log message for this mock */
  logMessage?: string;
  /** Optional follow-up response sent after the initial response (e.g. Solana signatureNotification) */
  followUpResponse?: object;
  /** Delay before sending the follow-up response (in milliseconds) */
  followUpDelay?: number;
};
