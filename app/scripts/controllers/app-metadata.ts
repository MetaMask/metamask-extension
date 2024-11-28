import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';

// Unique name for the controller
const controllerName = 'AppMetadataController';

/**
 * The options that AppMetadataController takes.
 */
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
export type AppMetadataControllerActions = AppMetadataControllerGetStateAction;

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
type AppMetadataControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  AppMetadataControllerActions | AllowedActions,
  AppMetadataControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * {@link AppMetadataController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata = {
  currentAppVersion: {
    persist: true,
    anonymous: true,
  },
  previousAppVersion: {
    persist: true,
    anonymous: true,
  },
  previousMigrationVersion: {
    persist: true,
    anonymous: true,
  },
  currentMigrationVersion: {
    persist: true,
    anonymous: true,
  },
};

/**
 * The AppMetadata controller stores metadata about the current extension instance,
 * including the currently and previously installed versions, and the most recently
 * run migration.
 *
 */
export default class AppMetadataController extends BaseController<
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
}
