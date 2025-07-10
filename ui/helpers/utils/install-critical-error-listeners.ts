import type browser from 'webextension-polyfill';
import { isObject, hasProperty } from '@metamask/utils';
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
export function installCriticalStartupErrorListeners(
  container: HTMLElement,
  port: browser.Runtime.Port,
) {
  port.onMessage.addListener((message) => {
    if (!isObject(message) || !hasProperty(message, 'data')) {
      // Ignore messages that are not objects or do not have a 'data' property,
      // they're likely for some other purpose
      return;
    }
    const { data } = message;
    if (!isObject(data) || !hasProperty(data, 'method')) {
      // Ignore the data property if it not an object or does not have a
      // 'method' property, they're likely for some other purpose
      return;
    }
    const { method } = data;
    // Currently, we only handle RELOAD_WINDOW, and the state corruption error
    // message, but we will be adding more in the future.
    if (method === 'RELOAD_WINDOW') {
      // This is a special case where we want to reload the page
      window.location.reload();
    } else if (method === METHOD_DISPLAY_STATE_CORRUPTION_ERROR) {
      if (!hasProperty(data, 'params') || !isObject(data.params)) {
        log.error(
          'Received state corruption error message without valid params:',
          message,
        );
        return;
      }

      const { error, hasBackup, currentLocale } = data.params as {
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
