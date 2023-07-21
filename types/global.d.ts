// In order for variables to be considered on the global scope they must be
// declared using var and not const or let, which is why this rule is disabled
/* eslint-disable no-var */
import * as Sentry from '@sentry/browser';

declare class Platform {
  openTab: (opts: { url: string }) => void;

  closeCurrentWindow: () => void;
}

declare class SentryObject extends Sentry {
  startSession: () => void;

  endSession: () => void;

  toggleSession: () => void;
}

export declare global {
  var platform: Platform;
  var sentry: Sentry;

  namespace jest {
    interface Matchers<R> {
      toBeFulfilled(): Promise<R>;
      toNeverResolve(): Promise<R>;
    }
  }
}
