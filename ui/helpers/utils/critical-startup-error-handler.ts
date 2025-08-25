import type browser from 'webextension-polyfill';
import { isObject, hasProperty, createDeferredPromise } from '@metamask/utils';
import log from 'loglevel';
import { METHOD_DISPLAY_STATE_CORRUPTION_ERROR } from '../../../shared/constants/state-corruption';
import type { ErrorLike } from '../../../shared/constants/errors';
import {
  BACKGROUND_LIVENESS_REQUEST,
  BACKGROUND_LIVENESS_RESPONSE,
} from '../../../shared/constants/background-liveness-check';
import {
  DISPLAY_GENERAL_STARTUP_ERROR,
  RELOAD_WINDOW,
} from '../../../shared/constants/start-up-errors';
import { displayStateCorruptionError } from './state-corruption-html';
import {
  displayCriticalError,
  CriticalErrorTranslationKey,
} from './display-critical-error';

// This should be long enough that it doesn't trigger when the popup is opened soon after startup.
// The extension can take a few seconds to start up after a reload.
const BACKGROUND_CONNECTION_TIMEOUT = 10_000; // 10 Seconds

type Message = {
  data: {
    method: string;
    params?: Record<string, unknown>;
  };
};

export class CriticalStartupErrorHandler {
  #port: browser.Runtime.Port;

  #container: HTMLElement;

  #livenessCheckTimeoutId?: NodeJS.Timeout;

  #onLivenessCheckCompleted?: () => void;

  /**
   * Creates an instance of CriticalStartupErrorHandler.
   * This class listens for critical startup errors from the background script
   * and displays appropriate error messages in the UI.
   *
   * @param port - The port to listen for messages on.
   * @param container - The container element to display the error in.
   */
  constructor(port: browser.Runtime.Port, container: HTMLElement) {
    this.#port = port;
    this.#container = container;
  }

  /**
   * Verify that the background connection is operational.
   */
  async #startLivenessCheck() {
    const { promise: livenessCheck, resolve: onLivenessCheckCompleted } =
      createDeferredPromise();
    // This is called later in `#handle` when the response is received.
    this.#onLivenessCheckCompleted = onLivenessCheckCompleted;

    this.#port.postMessage({
      data: { method: BACKGROUND_LIVENESS_REQUEST },
      name: 'background-liveness',
    });
    const timeoutPromise = new Promise((_resolve, reject) => {
      this.#livenessCheckTimeoutId = setTimeout(
        () => reject(new Error('Background connection unresponsive')),
        BACKGROUND_CONNECTION_TIMEOUT,
      );
    });

    try {
      await Promise.race([livenessCheck, timeoutPromise]);
    } catch (error) {
      await displayCriticalError(
        this.#container,
        CriticalErrorTranslationKey.TroubleStarting,
        // This cast is safe because `livenessCheck` can't throw, and `timeoutPromise` only throws an
        // error.
        error as ErrorLike,
      );
    } finally {
      clearTimeout(this.#livenessCheckTimeoutId);
    }
  }

  /**
   * Handles incoming messages from the background script.
   *
   * @param message - The message received from the background script.
   */
  #handler = async (message: Message) => {
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
    // Currently, we only handle BACKGROUND_LIVENESS_RESPONSE, RELOAD_WINDOW, and the state
    // corruption error message, but we will be adding more in the future.
    if (method === BACKGROUND_LIVENESS_RESPONSE) {
      if (this.#onLivenessCheckCompleted) {
        this.#onLivenessCheckCompleted();
      } else {
        await displayCriticalError(
          this.#container,
          CriticalErrorTranslationKey.TroubleStarting,
          new Error('Unreachable error, liveness check not initialized'),
        );
      }
    } else if (method === RELOAD_WINDOW) {
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
        this.#container,
        this.#port,
        error,
        hasBackup,
        currentLocale,
      );
    } else if (method === DISPLAY_GENERAL_STARTUP_ERROR) {
      if (!hasProperty(data, 'params') || !isObject(data.params)) {
        log.error(
          'Received general start up error message without valid params:',
          message,
        );
        return;
      }

      const { error, currentLocale } = data.params as {
        error: ErrorLike;
        currentLocale?: string;
      };
      await displayCriticalError(
        this.#container,
        CriticalErrorTranslationKey.TroubleStarting,
        error as ErrorLike,
        currentLocale,
      );
    }
  };

  /**
   * Detect and react to critical errors such as state corruption.
   *
   * This function attempts to verify that the connection to the background is active, displaying
   * a critical error if it's not.
   *
   * It also attaches an error listener to the provided port to handle state corruption errors.
   * This function listens for messages from the background script and displays a state corruption
   * error if the appropriate message is received.
   *
   * Critical error messages are transferred over a raw browser `Port`, not with
   * `PortStream` wrapper. We want to be as close to the "metal" as possible here,
   * it minimize abstractions that could cause further issues.
   */
  install() {
    this.#port.onMessage.addListener(this.#handler);

    // Called without `await` intentionally to ensure listeners for other messages are added as
    // quickly as possible.
    this.#startLivenessCheck();
  }

  /**
   * Uninstall the error listeners from the port, and cancel any ongoing liveness check.
   */
  uninstall() {
    this.#port.onMessage.removeListener(this.#handler);

    clearTimeout(this.#livenessCheckTimeoutId);
    if (this.#onLivenessCheckCompleted) {
      // Resolve just to allow any unresolved Promise to be garbage collected.
      this.#onLivenessCheckCompleted();
      this.#onLivenessCheckCompleted = undefined;
    }
  }
}
