import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import { AppMetadataControllerMethodActions } from './app-metadata-method-action-types';

// Unique name for the controller
const controllerName = 'AppMetadataController';

/**
 * Information about when MetaMask was first installed.
 * This is recorded on first installation and never changes.
 */
export type FirstTimeInfo = {
  /** The MetaMask version when first installed */
  version: string;
  /** Timestamp (Date.now()) when first installed */
  date: number;
};

/**
 * The options that AppMetadataController takes.
 */

/**
 * Google Analytics identifiers captured from the metamask.io `_ga` cookie at
 * install time.
 */
export type InstallGaAttribution = {
  /** Raw `_ga` cookie value. Maps to the Segment `cookie_id` trait. */
  cookieId: string;
  /** Parsed Google Analytics client identifier. Maps to the Segment `ga_client_id` trait. */
  gaClientId?: string;
};

export type AppMetadataControllerOptions = {
  state?: Partial<AppMetadataControllerState>;
  messenger: AppMetadataControllerMessenger;
  currentMigrationVersion?: number;
  currentAppVersion?: string;
};

/**
 * The state of the AppMetadataController
 */
export type AppMetadataControllerState = {
  currentAppVersion: string;
  previousAppVersion: string;
  previousMigrationVersion: number;
  currentMigrationVersion: number;
  /** Installation version and date - set once on first install, never changes */
  firstTimeInfo?: FirstTimeInfo;
  installAttribution: InstallGaAttribution | null;
};

/**
 * Function to get default state of the {@link AppMetadataController}.
 */
export const getDefaultAppMetadataControllerState =
  (): AppMetadataControllerState => ({
    currentAppVersion: '',
    previousAppVersion: '',
    previousMigrationVersion: 0,
    currentMigrationVersion: 0,
    firstTimeInfo: undefined,
    installAttribution: null,
  });

/**
 * Returns the state of the {@link AppMetadataController}.
 */
export type AppMetadataControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  AppMetadataControllerState
>;

/**
 * Actions exposed by the {@link AppMetadataController}.
 */
export type AppMetadataControllerActions =
  | AppMetadataControllerGetStateAction
  | AppMetadataControllerMethodActions;

/**
 * Event emitted when the state of the {@link AppMetadataController} changes.
 */
export type AppMetadataControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  AppMetadataControllerState
>;

export type AppMetadataControllerEvents = AppMetadataControllerStateChangeEvent;

/**
 * Actions that this controller is allowed to call.
 */
type AllowedActions = never;

/**
 * Events that this controller is allowed to subscribe.
 */
type AllowedEvents = never;

/**
 * Messenger type for the {@link AppMetadataController}.
 */
export type AppMetadataControllerMessenger = Messenger<
  typeof controllerName,
  AppMetadataControllerActions | AllowedActions,
  AppMetadataControllerEvents | AllowedEvents
>;

/**
 * {@link AppMetadataController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata: StateMetadata<AppMetadataControllerState> = {
  currentAppVersion: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  previousAppVersion: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  previousMigrationVersion: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  currentMigrationVersion: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  firstTimeInfo: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  installAttribution: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: false,
  },
};

/**
 * Methods exposed by the {@link AppMetadataController} messenger.
 */
const MESSENGER_EXPOSED_METHODS = [
  'maybeRecordFirstTimeInfo',
  'setInstallAttribution',
] as const;

/**
 * The AppMetadata controller stores metadata about the current extension instance,
 * including the currently and previously installed versions, and the most recently
 * run migration.
 *
 */
export class AppMetadataController extends BaseController<
  typeof controllerName,
  AppMetadataControllerState,
  AppMetadataControllerMessenger
> {
  /**
   * Constructs a AppMetadata controller.
   *
   * @param options - the controller options
   * @param options.state - Initial controller state.
   * @param options.messenger - Messenger used to communicate with BaseV2 controller.
   * @param options.currentMigrationVersion
   * @param options.currentAppVersion
   */
  constructor({
    state = {},
    messenger,
    currentAppVersion = '',
    currentMigrationVersion = 0,
  }: AppMetadataControllerOptions) {
    super({
      name: controllerName,
      metadata: controllerMetadata,
      state: {
        ...getDefaultAppMetadataControllerState(),
        ...state,
      },
      messenger,
    });

    this.#maybeUpdateAppVersion(currentAppVersion);

    this.#maybeUpdateMigrationVersion(currentMigrationVersion);

    this.messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  /**
   * Updates the currentAppVersion in state, and sets the previousAppVersion to the old currentAppVersion.
   *
   * @param maybeNewAppVersion
   */
  #maybeUpdateAppVersion(maybeNewAppVersion: string): void {
    const oldCurrentAppVersion = this.state.currentAppVersion;

    if (maybeNewAppVersion !== oldCurrentAppVersion) {
      this.update((state) => {
        state.currentAppVersion = maybeNewAppVersion;
        state.previousAppVersion = oldCurrentAppVersion;
      });
    }
  }

  /**
   * Updates the migrationVersion in state.
   *
   * @param maybeNewMigrationVersion
   */
  #maybeUpdateMigrationVersion(maybeNewMigrationVersion: number): void {
    const oldCurrentMigrationVersion = this.state.currentMigrationVersion;

    if (maybeNewMigrationVersion !== oldCurrentMigrationVersion) {
      this.update((state) => {
        state.previousMigrationVersion = oldCurrentMigrationVersion;
        state.currentMigrationVersion = maybeNewMigrationVersion;
      });
    }
  }

  /**
   * Records the first time info if it hasn't been set yet.
   * This captures the version and date when MetaMask was first installed.
   * Once set, this value never changes.
   *
   * @param version - The current MetaMask version
   */
  maybeRecordFirstTimeInfo(version: string): void {
    if (!this.state.firstTimeInfo) {
      this.update((state) => {
        state.firstTimeInfo = {
          version,
          date: Date.now(),
        };
      });
    }
  }

  /**
   * Records Google Analytics identifiers captured at install time.
   * Write-once: no-op if install attribution is already set, or if `cookieId` is empty.
   *
   * @param attribution - Install-time GA cookie values.
   * @param attribution.cookieId - Raw `_ga` cookie value.
   * @param attribution.gaClientId - Parsed Google Analytics client identifier.
   */
  setInstallAttribution({
    cookieId,
    gaClientId,
  }: {
    cookieId: string;
    gaClientId?: string;
  }): void {
    if (this.state.installAttribution || !cookieId) {
      return;
    }

    this.update((state) => {
      state.installAttribution = gaClientId
        ? { cookieId, gaClientId }
        : { cookieId };
    });
  }
}
