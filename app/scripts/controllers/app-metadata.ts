import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import ExtensionPlatform from '../platforms/extension';

const platform = new ExtensionPlatform();

/**
 * The state of the AppMetadataController
 */
export type AppMetadataControllerState = {
  currentAppVersion: string;
  previousAppVersion: string;
  previousMigrationVersion: string;
  currentMigrationVersion: string;
};

/**
 * The options that NetworkController takes.
 */
export type AppMetadataControllerOptions = {
  currentAppVersion?: string;
  state?: Partial<AppMetadataControllerState>;
};

const defaultState: AppMetadataControllerState = {
  currentAppVersion: '',
  previousAppVersion: '',
  previousMigrationVersion: '',
  currentMigrationVersion: '',
};

/**
 * The AppMetadata controller stores metadata about the current extension instance,
 * including the currently and previously installed versions, and the most recently
 * run migration.
 *
 */
export class AppMetadataController extends EventEmitter {
  /**
   * Observable store containing controller data.
   */
  store: ObservableStore<AppMetadataControllerState>;

  /**
   * Constructs a AppMetadata controller.
   *
   * @param options.state - Initial controller state.
   * {@link AppMetadataControllerOptions}.
   */
  constructor({
    currentMigrationVersion = '',
    state = {},
  }: AppMetadataControllerOptions) {
    super();

    this.store = new ObservableStore({
      ...defaultState,
      ...state,
    });

    this.maybeUpdateAppVersion();

    this.maybeUpdateMigrationVersion(currentMigrationVersion);
  }

  /**
   * Updates the currentAppVersion in state, and sets the previousAppVersion to the old currentAppVersion.
   */
  maybeUpdateAppVersion(): void {
    const maybeNewAppVersion = platform.getVersion();
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
   */
  maybeUpdateMigrationVersion(maybeNewMigrationVersion: string): void {
    const oldCurrentMigrationVersion = this.store.getState().currentMigrationVersion;

    if (maybeNewMigrationVersion !== oldCurrentMigrationVersion) {
      this.store.updateState({
        previousMigrationVersion: oldCurrentMigrationVersion,
        currentMigrationVersion: maybeNewMigrationVersion,
      });
    }
  }
};