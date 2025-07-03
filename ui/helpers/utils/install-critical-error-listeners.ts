import type browser from 'webextension-polyfill';
import { isObject } from 'lodash';
import { hasProperty } from '@metamask/utils';
import log from 'loglevel';
import { METHOD_DISPLAY_STATE_CORRUPTION_ERROR } from '../../../shared/constants/state-corruption';
import type { ErrorLike } from '../../../shared/constants/errors';
import { displayStateCorruptionError } from './state-corruption-html';

/**
 * Connects error listeners to the provided port to handle state corruption errors.
 * This function listens for messages from the background script and displays
 * a state corruption error if the appropriate message is received.
 *
 * Critical error messages are transferred over a raw browser `Port`, not with
 * `PortStream` wrapper. We want to be as close to the "metal" as possible here,
 * it minimize abstractions that could cause further issues.
 *
 * @param container - The container element to display the error in.
 * @param port - The port to listen for messages on.
 */
export function installCriticalErrorListeners(
  container: HTMLElement,
  port: browser.Runtime.Port,
) {
  port.onMessage.addListener((message) => {
    if (!isObject(message) || !hasProperty(message, 'method')) {
      // Ignore messages that are not objects or do not have a method property,
      // they're likely for some other purpose
      return;
    }

    // Currently, we only handle the state corruption error message, but we will
    // be adding more in the future.
    if (message.method === METHOD_DISPLAY_STATE_CORRUPTION_ERROR) {
      if (!hasProperty(message, 'params') || !isObject(message.params)) {
        log.error(
          'Received state corruption error message without valid params:',
          message,
        );
        return;
      }

      const { error, hasBackup, currentLocale } = message.params as {
        error: ErrorLike;
        hasBackup: boolean;
        currentLocale?: string;
      };
      displayStateCorruptionError(
        container,
        port,
        error,
        hasBackup,
        currentLocale,
      );
    }
  });
}
