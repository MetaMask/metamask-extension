import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';

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
 * The options that NetworkController takes.
 */
export type AppMetadataControllerOptions = {
  currentMigrationVersion?: number;
  currentAppVersion?: string;
  state?: Partial<AppMetadataControllerState>;
};

const defaultState: AppMetadataControllerState = {
  currentAppVersion: '',
  previousAppVersion: '',
  previousMigrationVersion: 0,
  currentMigrationVersion: 0,
};

/**
 * The AppMetadata controller stores metadata about the current extension instance,
 * including the currently and previously installed versions, and the most recently
 * run migration.
 *
 */
export default class AppMetadataController extends EventEmitter {
  /**
   * Observable store containing controller data.
   */
  store: ObservableStore<AppMetadataControllerState>;

  /**
   * Constructs a AppMetadata controller.
   *
   * @param options - the controller options
   * @param options.state - Initial controller state.
   * @param options.currentMigrationVersion
   * @param options.currentAppVersion
   */
  constructor({
    currentAppVersion = '',
    currentMigrationVersion = 0,
    state = {},
  }: AppMetadataControllerOptions) {
    super();

    this.store = new ObservableStore({
      ...defaultState,
      ...state,
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
    const oldCurrentAppVersion = this.store.getState().currentAppVersion;

    if (maybeNewAppVersion !== oldCurrentAppVersion) {
      this.store.updateState({
        currentAppVersion: maybeNewAppVersion,
        previousAppVersion: oldCurrentAppVersion,
      });
    }
  }

  /**
   * Updates the migrationVersion in state.
   *
   * @param maybeNewMigrationVersion
   */
  #maybeUpdateMigrationVersion(maybeNewMigrationVersion: number): void {
    const oldCurrentMigrationVersion =
      this.store.getState().currentMigrationVersion;

    if (maybeNewMigrationVersion !== oldCurrentMigrationVersion) {
      this.store.updateState({
        previousMigrationVersion: oldCurrentMigrationVersion,
        currentMigrationVersion: maybeNewMigrationVersion,
      });
    }
  }
}
