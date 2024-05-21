import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import MetaMetricsController from '../metametrics';
import {
  createDataDeletionRegulationTask,
  fetchDeletionRegulationStatus,
} from './services/services';

// Unique name for the controller
const controllerName = 'MetaMetricsDataDeletionController';

export type DataDeleteDate = string;
export type DataDeleteRegulationId = string;

export type RegulationId = Record<string, string>;
export type CurrentRegulationStatus = Record<string, Record<string, string>>;
export type DeleteRegulationAPIResponse = {
  data: RegulationId | CurrentRegulationStatus;
};

export enum DeleteRegulationStatus {
  FAILED = 'FAILED',
  FINISHED = 'FINISHED',
  INITIALIZED = 'INITIALIZED',
  INVALID = 'INVALID',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  RUNNING = 'RUNNING',
  UNKNOWN = 'UNKNOWN',
}

export type MetaMetricsDataDeletionState = {
  metaMetricsDataDeletionId: DataDeleteRegulationId;
  metaMetricsDataDeletionDate: DataDeleteDate;
  metaMetricsDataDeletionStatus?: DeleteRegulationStatus;
};

const defaultState: MetaMetricsDataDeletionState = {
  metaMetricsDataDeletionId: '',
  metaMetricsDataDeletionDate: '',
  metaMetricsDataDeletionStatus: undefined,
};

// Metadata for the controller state
const metadata = {
  metaMetricsDataDeletionId: {
    persist: true,
    anonymous: true,
  },
  metaMetricsDataDeletionDate: {
    persist: true,
    anonymous: true,
  },
  metaMetricsDataDeletionStatus: {
    persist: true,
    anonymous: true,
  },
};

// Describes the action creating the delete regulation task
export type CreateMetaMetricsDataDeletionTaskAction = {
  type: `${typeof controllerName}:createMetaMetricsDataDeletionTask`;
  handler: MetaMetricsDataDeletionController['createMetaMetricsDataDeletionTask'];
};

// Describes the action to check teh existing regulation status
export type CheckDataDeletionTaskStatusAction = {
  type: `${typeof controllerName}:checkDataDeletionTaskStatus`;
  handler: MetaMetricsDataDeletionController['checkDataDeletionTaskStatus'];
};

// Union of all possible actions for the messenger
export type MetaMetricsDataDeletionControllerMessengerActions =
  | CreateMetaMetricsDataDeletionTaskAction
  | CheckDataDeletionTaskStatusAction;

// Type for the messenger of AccountOrderController
export type MetaMetricsDataDeletionControllerMessenger =
  RestrictedControllerMessenger<
    typeof controllerName,
    MetaMetricsDataDeletionControllerMessengerActions,
    never,
    never,
    never
  >;

/**
 * Controller responsible for maintaining
 * state related to Metametrics data deletion
 */
export default class MetaMetricsDataDeletionController extends BaseController<
  typeof controllerName,
  MetaMetricsDataDeletionState,
  MetaMetricsDataDeletionControllerMessenger
> {
  private metaMetricsController: MetaMetricsController;

  /**
   * Creates a MetaMetricsDataDeletionController instance.
   *
   * @param args - The arguments to this function.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   * @param args.metaMetricsController
   */
  constructor({
    messenger,
    state,
    metaMetricsController,
  }: {
    messenger: MetaMetricsDataDeletionControllerMessenger;
    state?: MetaMetricsDataDeletionState;
    metaMetricsController: MetaMetricsController;
  }) {
    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });
    this.metaMetricsController = metaMetricsController;
  }

  _formatDeletionDate() {
    const currentDate = new Date();
    const day = currentDate.getUTCDate();
    const month = currentDate.getUTCMonth() + 1;
    const year = currentDate.getUTCFullYear();

    // format the date in the format DD/MM/YYYY
    return `${day}/${month}/${year}`;
  }

  async createMetaMetricsDataDeletionTask(): Promise<void> {
    const { metaMetricsId } = this.metaMetricsController.store.getState();
    if (!metaMetricsId) {
      throw new Error('MetaMetrics ID not found');
    }

    try {
      const { data } = await createDataDeletionRegulationTask(
        metaMetricsId as string,
      );
      this.update((state) => {
        state.metaMetricsDataDeletionId = data?.regulateId as string;
        state.metaMetricsDataDeletionDate = this._formatDeletionDate();
        return state;
      });
      await this.checkDataDeletionTaskStatus();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error ?? '');
      throw new Error(`Metametrics Data Deletion Error: ${errorMessage}`);
    }
  }

  async checkDataDeletionTaskStatus(): Promise<void> {
    const deleteRegulationId = this.state.metaMetricsDataDeletionId;
    if (deleteRegulationId.length === 0) {
      throw new Error('Delete Regulation id not found');
    }

    try {
      const { data } = await fetchDeletionRegulationStatus(deleteRegulationId);

      const regulation = data?.regulation as Record<string, string>;
      this.update((state) => {
        state.metaMetricsDataDeletionStatus =
          regulation.overallStatus as DeleteRegulationStatus;

        return state;
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error ?? '');
      throw new Error(`Metametrics Data Deletion Error: ${errorMessage}`);
    }
  }
}
