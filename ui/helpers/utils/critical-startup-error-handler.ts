import type browser from 'webextension-polyfill';
import { isObject, hasProperty, createDeferredPromise } from '@metamask/utils';
import log from 'loglevel';
import {
  CriticalErrorType,
  METHOD_DISPLAY_STATE_CORRUPTION_ERROR,
} from '../../../shared/constants/state-corruption';
import type { ErrorLike } from '../../../shared/constants/errors';
import {
  APP_INIT_LIVENESS_METHOD,
  BACKGROUND_LIVENESS_METHOD,
  BACKGROUND_INITIALIZED_METHOD,
} from '../../../shared/constants/ui-initialization';
import {
  DISPLAY_GENERAL_STARTUP_ERROR,
  RELOAD_WINDOW,
} from '../../../shared/constants/start-up-errors';
import { displayStateCorruptionError } from './state-corruption-html';
import {
  displayCriticalErrorMessage,
  CriticalErrorTranslationKey,
} from './display-critical-error';

// This should be long enough that it doesn't trigger when the popup is opened soon after startup.
// The extension can take a few seconds to start up after a reload.
// changed from 10_000 to 15_000 on 11/26/2025 in order to measure effect.
const BACKGROUND_CONNECTION_TIMEOUT = 15_000; // 15 Seconds

// Timeout for background controller initialization after the liveness check passes.
const BACKGROUND_INITIALIZATION_TIMEOUT = 16_000; // 16 seconds

// Timeout for the background to serialize and send the full state to the UI.
const STATE_SYNC_TIMEOUT = 16_000; // 16 seconds

type Message = {
  data: {
    method: string;
    params?: Record<string, unknown>;
  };
};

export class CriticalStartupErrorHandler {
  #port: browser.Runtime.Port;

  #container: HTMLElement;

  #receivedAppInitPing = false;

  #livenessCheckTimeoutId?: NodeJS.Timeout;

  #onLivenessCheckCompleted?: () => void;

  #initializationCheckTimeoutId?: NodeJS.Timeout;

  #onInitializationCheckCompleted?: () => void;

  #initializationCompleted = false;

  #startUiSyncTimeoutId?: NodeJS.Timeout;

  #onStartUiSyncCompleted?: () => void;

  #startUiSyncCompleted = false;

  // Guards against starting new phases after uninstall(). When uninstall()
  // resolves pending promises to prevent memory leaks, those resolutions can
  // trigger the next phase (e.g., liveness -> initialization). This flag
  // ensures those transitions are suppressed once the handler is uninstalled.
  #uninstalled = false;

  /**
   * Creates an instance of CriticalStartupErrorHandler.
   * This class listens for critical startup errors from the background script
   * and displays appropriate error messages in the UI.
   *
   * It monitors three sequential phases of startup:
   * 1. Liveness check: verifies the background connection is active (ALIVE message)
   * 2. Initialization check: verifies background controller initialization completes (BACKGROUND_INITIALIZED message)
   * 3. State sync check: verifies the background sends its state to the UI (START_UI_SYNC message)
   *
   * @param port - The port to listen for messages on.
   * @param container - The container element to display the error in.
   */
  constructor(port: browser.Runtime.Port, container: HTMLElement) {
    this.#port = port;
    this.#container = container;
  }

  /**
   * Attaches the app-init liveness Sentry tag to an error for diagnostics.
   * Used when displaying any phase timeout so we can tell whether the port
   * worked at app-init level (see PR #40189).
   *
   * @param error - The error to attach the tag to (mutated in place).
   */
  #attachAppInitPingSentryTag(error: ErrorLike): void {
    (error as unknown as { sentryTags?: Record<string, unknown> }).sentryTags =
      {
        // we want to know if a problem happens between app-init's onConnect and
        // this background's onConnect. if we receive the app-init liveness
        // ping, then we can be pretty confident that the connection was working
        // but something went wrong between app-init and background.js.
        // If after a few months, we find that most of the errors are happening
        // without receiving the app-init ping (`uiStartup.receivedAppInitPing`
        // is false), then we can be pretty confident that the port connection
        // itself just isn't working, and we can remove the
        // `uiStartup.receivedAppInitPing` tag and all logic related to it
        // since it won't be providing any useful information anymore. However,
        // if we find that some errors are happening with receiving the app-init
        // ping (`uiStartup.receivedAppInitPing` is true), then we know that the
        // connection _can be_ working, but something is going wrong somewhere else, probably
        // related to the background.js startup process, and in that case, we
        // can remove the app-init ping logic since it will have served its
        // purpose of helping us.
        'uiStartup.receivedAppInitPing': this.#receivedAppInitPing.toString(),
      };
  }

  /**
   * Declare that the start UI sync message has been received.
   */
  startUiSyncReceived() {
    this.#startUiSyncCompleted = true;
    if (this.#onStartUiSyncCompleted) {
      this.#onStartUiSyncCompleted();
    }
  }

  /**
   * Phase 1: Verify that the background connection is operational.
   * Waits for the ALIVE message from the background.
   */
  async #startLivenessCheck() {
    const { promise: livenessCheck, resolve: onLivenessCheckCompleted } =
      createDeferredPromise();
    // This is called later in `#handler` when the ALIVE message is received.
    this.#onLivenessCheckCompleted = onLivenessCheckCompleted;

    const livenessCheckTimeoutPromise = new Promise((_resolve, reject) => {
      this.#livenessCheckTimeoutId = setTimeout(
        () => reject(new Error('Background connection unresponsive')),
        BACKGROUND_CONNECTION_TIMEOUT,
      );
    });

    let livenessError: Error | null = null;
    try {
      await Promise.race([livenessCheck, livenessCheckTimeoutPromise]);
    } catch (error) {
      livenessError = error as Error;
    }

    clearTimeout(this.#livenessCheckTimeoutId);
    this.#livenessCheckTimeoutId = undefined;
    if (livenessError !== null) {
      // add sentryTags to the error for better debugging in Sentry.
      this.#attachAppInitPingSentryTag(livenessError as ErrorLike);

      await displayCriticalErrorMessage(
        this.#container,
        CriticalErrorTranslationKey.TroubleStarting,
        livenessError as ErrorLike,
        undefined,
        this.#port,
        CriticalErrorType.BackgroundConnectionTimeout,
      );
    } else if (!this.#uninstalled) {
      if (!this.#initializationCompleted) {
        await this.#startInitializationCheck();
      } else if (!this.#startUiSyncCompleted) {
        await this.#startStateSyncCheck();
      }
    }
  }

  /**
   * Phase 2: Verify that background controller initialization completes.
   * Waits for the BACKGROUND_INITIALIZED message from the background.
   */
  async #startInitializationCheck() {
    const {
      promise: initializationCheck,
      resolve: onInitializationCheckCompleted,
    } = createDeferredPromise();
    // This is called later in `#handler` when the BACKGROUND_INITIALIZED message is received.
    this.#onInitializationCheckCompleted = onInitializationCheckCompleted;

    const initializationTimeoutPromise = new Promise((_resolve, reject) => {
      this.#initializationCheckTimeoutId = setTimeout(
        () => reject(new Error('Background initialization timeout')),
        BACKGROUND_INITIALIZATION_TIMEOUT,
      );
    });

    let initError: Error | null = null;
    try {
      await Promise.race([initializationCheck, initializationTimeoutPromise]);
    } catch (error) {
      initError = error as Error;
    }

    clearTimeout(this.#initializationCheckTimeoutId);
    this.#initializationCheckTimeoutId = undefined;
    if (initError !== null) {
      // add sentryTags to the error for better debugging in Sentry.
      this.#attachAppInitPingSentryTag(initError as ErrorLike);

      await displayCriticalErrorMessage(
        this.#container,
        CriticalErrorTranslationKey.TroubleStarting,
        initError as ErrorLike,
        undefined,
        this.#port,
        CriticalErrorType.BackgroundInitTimeout,
      );
    } else if (!this.#uninstalled && !this.#startUiSyncCompleted) {
      await this.#startStateSyncCheck();
    }
  }

  /**
   * Phase 3: Verify that the background sends its state to the UI.
   * Waits for the START_UI_SYNC message from the background.
   */
  async #startStateSyncCheck() {
    const { promise: stateSyncCheck, resolve: onStateSyncCompleted } =
      createDeferredPromise();
    // This is called later via `startUiSyncReceived()` when the START_UI_SYNC message is received.
    this.#onStartUiSyncCompleted = onStateSyncCompleted;

    const stateSyncTimeoutPromise = new Promise((_resolve, reject) => {
      this.#startUiSyncTimeoutId = setTimeout(
        () => reject(new Error('Background state sync timeout')),
        STATE_SYNC_TIMEOUT,
      );
    });

    let stateSyncError: Error | null = null;
    try {
      await Promise.race([stateSyncCheck, stateSyncTimeoutPromise]);
    } catch (error) {
      stateSyncError = error as Error;
    }

    clearTimeout(this.#startUiSyncTimeoutId);
    this.#startUiSyncTimeoutId = undefined;
    if (stateSyncError !== null) {
      // add sentryTags to the error for better debugging in Sentry.
      this.#attachAppInitPingSentryTag(stateSyncError as ErrorLike);

      await displayCriticalErrorMessage(
        this.#container,
        CriticalErrorTranslationKey.TroubleStarting,
        stateSyncError as ErrorLike,
        undefined,
        this.#port,
        CriticalErrorType.BackgroundStateSyncTimeout,
      );
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
    // Currently, we handle APP_INIT_LIVENESS_METHOD, BACKGROUND_LIVENESS_METHOD,
    // BACKGROUND_INITIALIZED_METHOD, RELOAD_WINDOW, the state corruption error message,
    // and the general startup error message.
    if (method === APP_INIT_LIVENESS_METHOD) {
      this.#receivedAppInitPing = true;
    } else if (method === BACKGROUND_LIVENESS_METHOD) {
      if (this.#onLivenessCheckCompleted) {
        this.#onLivenessCheckCompleted();
      } else {
        await displayCriticalErrorMessage(
          this.#container,
          CriticalErrorTranslationKey.TroubleStarting,
          new Error('Unreachable error, liveness check not initialized'),
          undefined,
          this.#port,
        );
      }
    } else if (method === BACKGROUND_INITIALIZED_METHOD) {
      this.#initializationCompleted = true;
      if (this.#onInitializationCheckCompleted) {
        this.#onInitializationCheckCompleted();
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
      await displayCriticalErrorMessage(
        this.#container,
        CriticalErrorTranslationKey.TroubleStarting,
        error as ErrorLike,
        currentLocale,
        this.#port,
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
   * Uninstall the error listeners from the port, and cancel any ongoing checks.
   */
  uninstall() {
    this.#uninstalled = true;
    this.#port.onMessage.removeListener(this.#handler);

    clearTimeout(this.#livenessCheckTimeoutId);
    clearTimeout(this.#initializationCheckTimeoutId);
    clearTimeout(this.#startUiSyncTimeoutId);

    // This may be called before the `START_UI_SYNC` message is received
    // If so, we can resolve the promise here. This also ensures it doesn't leak memory.
    if (this.#onStartUiSyncCompleted) {
      this.#onStartUiSyncCompleted();
      this.#onStartUiSyncCompleted = undefined;
    }
    // Resolve just to allow any unresolved Promise to be garbage collected.
    if (this.#onInitializationCheckCompleted) {
      this.#onInitializationCheckCompleted();
      this.#onInitializationCheckCompleted = undefined;
    }
    if (this.#onLivenessCheckCompleted) {
      this.#onLivenessCheckCompleted();
      this.#onLivenessCheckCompleted = undefined;
    }
  }
}
