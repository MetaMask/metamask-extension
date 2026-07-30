// Many of the state hooks return untyped raw state.

import * as Sentry from '@sentry/browser';
import type { Provider } from '@metamask/network-controller';
import type { Browser } from 'webextension-polyfill';
import type { Preferences } from '../shared/types/preferences';
import type ExtensionPlatform from '../app/scripts/platforms/extension';
import type { ExtensionLazyListener } from '../app/scripts/lib/extension-lazy-listener/extension-lazy-listener';
import type {
  LongTaskMetrics,
  LongTaskMetricsWithTBT,
} from '../ui/helpers/utils/performance-observers';
import type { Backup } from '../shared/lib/stores/persistence-manager';

type StateHooks = {
  getCustomTraces?: () => { [name: string]: number };
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCleanAppState?: () => Promise<any>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLogs?: () => any[];
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMostRecentPersistedState?: () => any;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPersistedState: (options?: { reportErrors?: boolean }) => Promise<any>;
  getStorageKind?: () => string;
  getBackupState?: () => Promise<Backup | null>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSentryAppState?: () => any;
  getSentryState: () => {
    browser: string;
    version: string;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state?: any;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persistedState?: any;
  };
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metamaskGetState?: () => Promise<any>;
  throwTestBackgroundError?: (msg?: string) => Promise<void>;
  throwTestError?: (msg?: string) => void;
  captureTestError?: (msg?: string) => Promise<void>;
  captureBackgroundError?: (msg?: string) => Promise<void>;
  /**
   * State hook used to verify that LavaMoat is applied correctly.
   *
   * Delegates to a test-only package (`@metamask/dummy-package`) that has no
   * policy grant for `console`. When invoked from inside that package's
   * compartment, the check for `console` must resolve to `false` because
   * LavaMoat withholds the endowment.
   *
   * @returns `true` if the dummy package can see a usable `console` in its
   * compartment — meaning LavaMoat is NOT enforcing its policy — and `false`
   * when the policy is correctly enforced.
   */
  hasConsoleAccess?: () => boolean;

  /**
   * This is initialized by the service worker in MV3. It is handled in `background.js`.
   */
  lazyListener?: ExtensionLazyListener<typeof chrome>;
  /**
   * Reload the extension. This is used to trigger extension reload from a page context by E2E
   * tests.
   */
  reloadExtension?: () => void;

  // Long Task / TBT metrics for E2E benchmarks
  getLongTaskMetrics?: (reset?: boolean) => LongTaskMetrics;
  getLongTaskMetricsWithTBT?: (reset?: boolean) => LongTaskMetricsWithTBT;
  resetLongTaskMetrics?: () => void;

  /**
   * Initialize Core Web Vitals observers (INP, LCP, CLS).
   *
   * @see ui/helpers/utils/web-vitals.ts
   */
  initWebVitals?: () => void;
  /**
   * Get current Core Web Vitals metrics.
   * Returns stored INP, FCP, LCP, and CLS values with their ratings.
   */
  getWebVitalsMetrics?: () => {
    inp: number | null;
    fcp: number | null;
    lcp: number | null;
    cls: number | null;
    inpRating: 'good' | 'needs-improvement' | 'poor' | null;
    fcpRating: 'good' | 'needs-improvement' | 'poor' | null;
    lcpRating: 'good' | 'needs-improvement' | 'poor' | null;
    clsRating: 'good' | 'needs-improvement' | 'poor' | null;
  };
  /**
   * Reset Core Web Vitals metrics to initial null state.
   * Useful for clearing metrics between benchmark runs.
   */
  resetWebVitalsMetrics?: () => void;

  // Agentic dev hooks (METAMASK_DEBUG only) — expose internals for CDP automation.
  // Typed as `unknown` because these are untyped debug-only entry points consumed
  // by CDP automation scripts that perform their own runtime checks.
  store?: unknown;
  submitRequestToBackground?: (
    method: string,
    args?: unknown[],
  ) => Promise<unknown>;
  getPerpsStreamManager?: () => unknown;
};

declare global {
  var platform: ExtensionPlatform;
  // Sentry is undefined in dev, so use optional chaining
  var sentry: Sentry | undefined;

  var chrome: typeof chrome;

  var ethereumProvider: Provider;

  var stateHooks: StateHooks;

  var logStateString: () => Promise<string>;

  var browser: Browser;

  var INFURA_PROJECT_ID: string | undefined;

  namespace jest {
    // The interface is being used for declaration merging, which is an acceptable exception to this rule.
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/naming-convention
    interface Matchers<R> {
      toBeFulfilled(): Promise<R>;
      toNeverResolve(): Promise<R>;
    }
  }

  /**
   * Unions T with U; U's properties will override T's properties
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  type OverridingUnion<T, U> = Omit<T, keyof U> & U;

  function setPreference(key: keyof Preferences, value: boolean);
}

// #region Promise.withResolvers polyfill

// this polyfill can be removed once our TS libs include withResolvers.
// at time of writing we use TypeScript Version 5.4.5, which includes it in
// esnext

export declare global {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  type PromiseWithResolvers<T> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason?: any) => void;
  };

  // we're extending the PromiseConstructor interface, to we have to use
  // `interface` (`type` won't work)
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface PromiseConstructor {
    /**
     * Creates a new Promise and returns it in an object, along with its resolve and reject functions.
     *
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
     *
     * @returns An object with the properties `promise`, `resolve`, and `reject`.
     *
     * ```ts
     * const { promise, resolve, reject } = Promise.withResolvers<T>();
     * ```
     */
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    withResolvers?: <T>() => PromiseWithResolvers<T>;
  }
}
// #endregion

// #region used in jest tests to ignore unhandled rejections
declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Process {
      setIgnoreUnhandled: (ignore: boolean) => void;
      resetIgnoreUnhandled: () => void;
    }
  }
}
// #endregion
