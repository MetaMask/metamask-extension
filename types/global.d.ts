// In order for variables to be considered on the global scope they must be
// declared using var and not const or let, which is why this rule is disabled
/* eslint-disable no-var */

import * as Sentry from '@sentry/browser';
import { SentryDebugState } from '../shared/modules/sentry.utils';

declare class Platform {
  openTab: (opts: { url: string }) => void;

  closeCurrentWindow: () => void;
}

export declare class SentryDebugInfo {
  browser?: string;

  store?: SentryDebugState;

  version?: string;
}

declare class StateHooks {
  getSentryState?: () => SentryDebugInfo;
}

export declare global {
  var platform: Platform;
  var stateHooks: StateHooks;
  var sentry: typeof Sentry & {
    toggleSentry: (participateInMetaMetrics: boolean) => void;
  };

  namespace jest {
    interface Matchers<R> {
      toBeFulfilled(): Promise<R>;
      toNeverResolve(): Promise<R>;
    }
  }
}
