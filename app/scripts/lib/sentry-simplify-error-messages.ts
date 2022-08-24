import {
  Event as SentryEvent,
  EventProcessor,
  Hub,
  Integration,
} from '@sentry/types';
import extractEthjsErrorMessage from './extractEthjsErrorMessage';

/**
 * Simplify error messages in Sentry error reports.
 */
export class SimplifyErrorMessages implements Integration {
  /**
   * Property that holds the integration name.
   */
  public static id = 'SimplifyErrorMessages';

  /**
   * Another property that holds the integration name.
   *
   * I don't know why this exists, but the other Sentry integrations have it.
   */
  public name: string = SimplifyErrorMessages.id;

  /**
   * Setup the integration.
   *
   * @param addGlobalEventProcessor - A function that allows adding a global
   * event processor.
   * @param getCurrentHub - A function that returns the current Sentry hub.
   */
  public setupOnce(
    addGlobalEventProcessor: (callback: EventProcessor) => void,
    getCurrentHub: () => Hub,
  ): void {
    addGlobalEventProcessor((currentEvent: SentryEvent) => {
      // Sentry integrations use the Sentry hub to get "this" references, for
      // reasons I don't fully understand.
      // eslint-disable-next-line consistent-this
      const self = getCurrentHub().getIntegration(SimplifyErrorMessages);
      if (self) {
        self.simplifyErrorMessages(currentEvent);
        return currentEvent;
      }
      return currentEvent;
    });
  }

  simplifyErrorMessages(event: SentryEvent) {
    this.rewriteErrorMessages(event, (errorMessage) => {
      // simplify ethjs error messages
      let simplifiedErrorMessage = extractEthjsErrorMessage(errorMessage);
      // simplify 'Transaction Failed: known transaction'
      if (
        simplifiedErrorMessage.indexOf(
          'Transaction Failed: known transaction',
        ) === 0
      ) {
        // cut the hash from the error message
        simplifiedErrorMessage = 'Transaction Failed: known transaction';
      }
      return simplifiedErrorMessage;
    });
  }

  rewriteErrorMessages(
    event: SentryEvent,
    rewriteFn: (message: string) => string,
  ) {
    // rewrite top level message
    if (typeof event.message === 'string') {
      event.message = rewriteFn(event.message);
    }
    // rewrite each exception message
    if (event.exception?.values) {
      event.exception.values.forEach((item) => {
        if (typeof item.value === 'string') {
          item.value = rewriteFn(item.value);
        }
      });
    }
  }
}
