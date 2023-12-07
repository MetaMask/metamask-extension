// In order for variables to be considered on the global scope they must be
// declared using var and not const or let, which is why this rule is disabled
/* eslint-disable no-var */
import * as Sentry from '@sentry/browser';

declare class Platform {
  openTab: (opts: { url: string }) => void;

  closeCurrentWindow: () => void;
}

declare class MessageSender {
  documentId?: string;

  documentLivecycle?: string;

  frameId?: number;

  id?: string;

  origin?: string;

  url?: string;
}

declare class Runtime {
  onMessage: {
    addListener: (
      callback: (
        message: any,
        sender: MessageSender,
        sendResponse: (response: any) => void,
      ) => void,
    ) => void;
  };

  sendMessage: (
    extensionId?: string,
    message: any,
    options?: Record<string, unknown>,
    callback?: (response: any) => void,
  ) => void;
}

declare class Chrome {
  runtime: Runtime;
}

type SentryObject = Sentry & {
  // Verifies that the user has opted into metrics and then updates the sentry
  // instance to track sessions and begins the session.
  startSession: () => void;

  // Verifies that the user has opted out of metrics and then updates the
  // sentry instance to NOT track sessions and ends the current session.
  endSession: () => void;

  // Calls either startSession or endSession based on optin status
  toggleSession: () => void;
};

export declare global {
  var platform: Platform;
  // Sentry is undefined in dev, so use optional chaining
  var sentry: SentryObject | undefined;

  var chrome: Chrome;

  namespace jest {
    interface Matchers<R> {
      toBeFulfilled(): Promise<R>;
      toNeverResolve(): Promise<R>;
    }
  }
}
