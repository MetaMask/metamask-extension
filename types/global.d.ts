// In order for variables to be considered on the global scope they must be
// declared using var and not const or let, which is why this rule is disabled
/* eslint-disable no-var */

import { Client } from '@sentry/types';

declare class Platform {
  openTab: (opts: { url: string }) => void;

  closeCurrentWindow: () => void;
}

export declare global {
  var platform: Platform;

  namespace jest {
    interface Matchers<R> {
      toBeFulfilled(): Promise<R>;
      toNeverResolve(): Promise<R>;
    }
  }

  var sentry: Client;
}
