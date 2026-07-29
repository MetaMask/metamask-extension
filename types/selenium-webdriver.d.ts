// `@types/selenium-webdriver` types `WebDriver#createCDPConnection` as
// `Promise<any>` and does not declare the `devtools/CDPConnection` submodule
// at all, even though `selenium-webdriver` ships the class at that subpath.
// Add declarations for the submodule and narrow `createCDPConnection` so
// callers (see `test/e2e/webdriver/driver.js`) get proper typing instead of
// falling back to `any`.

declare module 'selenium-webdriver/devtools/CDPConnection' {
  /**
   * Raw CDP response envelope as parsed from the DevTools WebSocket. Fields
   * follow the Chrome DevTools Protocol shape.
   */
  export type CdpResponse<TResult = unknown> = {
    id: number;
    sessionId?: string;
    result?: TResult;
    error?: { code: number; message: string; data?: unknown };
  };

  /**
   * Runtime class exported from `selenium-webdriver/devtools/CDPConnection.js`.
   * The class is internally named `CDPConnection` but is exported as
   * `CdpConnection`.
   */
  export class CdpConnection {
    constructor(wsConnection: unknown);

    targetID: string | null;

    /**
     * CDP session id. Assign to route subsequent `send`/`execute` calls to
     * that session (e.g. after `Target.attachToTarget`).
     */
    sessionId: string | null;

    execute(
      method: string,
      params: Record<string, unknown> | undefined,
      callback: (error: Error | null) => void,
    ): void;

    send<TResult = unknown>(
      method: string,
      params?: Record<string, unknown>,
    ): Promise<CdpResponse<TResult>>;
  }
}

declare module 'selenium-webdriver' {
  import type { CdpConnection } from 'selenium-webdriver/devtools/CDPConnection';

  // Module augmentation of selenium-webdriver's `WebDriver` requires an
  // `interface` so the declaration merges with the upstream class.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface WebDriver {
    createCDPConnection(target: string): Promise<CdpConnection>;
  }
}
