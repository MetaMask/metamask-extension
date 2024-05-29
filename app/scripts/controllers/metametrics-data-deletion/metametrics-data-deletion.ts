import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { ObservableStore } from '@metamask/obs-store';
import { MetaMetricsControllerState } from '../metametrics';
import type { DataDeletionService } from '../../services/data-deletion-service';

// Unique name for the controller
const controllerName = 'MetaMetricsDataDeletionController';

/**
 * @type DataDeleteDate
 * Timestamp at which regulation response is returned.
 */
export type DataDeleteDate = number;
/**
 * @type DataDeleteDate
 * Regulation Id retuned while creating a delete regulation.
 */
export type DataDeleteRegulationId = string;

/**
 * @type DeleteRegulationStatus
 * The status on which to filter the returned regulations.
 */
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
/**
 * @type MetaMetricsDataDeletionState
 * MetaMetricsDataDeletionController controller state
 * @property metaMetricsDataDeletionId - Regulation Id retuned while creating a delete regulation.
 * @property metaMetricsDataDeletionDate - Date at which the most recent regulation is created/requested for.
 * @property metaMetricsDataDeletionStatus - Status of the current delete regulation.
 */
export type MetaMetricsDataDeletionState = {
  metaMetricsDataDeletionId: DataDeleteRegulationId;
  metaMetricsDataDeletionDate: DataDeleteDate;
  metaMetricsDataDeletionStatus?: DeleteRegulationStatus;
};

const defaultState: MetaMetricsDataDeletionState = {
  metaMetricsDataDeletionId: '',
  metaMetricsDataDeletionDate: 0,
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
export type UpdateDataDeletionTaskStatusAction = {
  type: `${typeof controllerName}:updateDataDeletionTaskStatus`;
  handler: MetaMetricsDataDeletionController['updateDataDeletionTaskStatus'];
};

// Union of all possible actions for the messenger
export type MetaMetricsDataDeletionControllerMessengerActions =
  | CreateMetaMetricsDataDeletionTaskAction
  | UpdateDataDeletionTaskStatusAction;

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
  private metaMetricsId;

  #dataDeletionService: DataDeletionService;

  /**
   * Creates a MetaMetricsDataDeletionController instance.
   *
   * @param args - The arguments to this function.
   * @param args.dataDeletionService - The service used for deleting data.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   * @param args.metaMetricsStore
   */
  constructor({
    dataDeletionService,
    messenger,
    state,
    metaMetricsStore,
  }: {
    dataDeletionService: DataDeletionService;
    messenger: MetaMetricsDataDeletionControllerMessenger;
    state?: MetaMetricsDataDeletionState;
    metaMetricsStore: ObservableStore<MetaMetricsControllerState>;
  }) {
    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });
    this.metaMetricsId = metaMetricsStore.getState().metaMetricsId;
    this.#dataDeletionService = dataDeletionService;
  }

  _formatDeletionDate() {
    const currentDate = new Date();
    const day = currentDate.getUTCDate();
    const month = currentDate.getUTCMonth() + 1;
    const year = currentDate.getUTCFullYear();

    // format the date in the format DD/MM/YYYY
    return `${day}/${month}/${year}`;
  }

  /**
   * Creating the delete regulation using source regulation
   *
   */
  async createMetaMetricsDataDeletionTask(): Promise<void> {
    if (!this.metaMetricsId) {
      throw new Error('MetaMetrics ID not found');
    }

    const { data } =
      await this.#dataDeletionService.createDataDeletionRegulationTask(
        this.metaMetricsId,
      );
    this.update((state) => {
      state.metaMetricsDataDeletionId = data?.regulateId;
      state.metaMetricsDataDeletionDate = Date.now();
      return state;
    });
    await this.updateDataDeletionTaskStatus();
  }

  /**
   * To check eth status of the current delete regulation.
   */
  async updateDataDeletionTaskStatus(): Promise<void> {
    const deleteRegulationId = this.state.metaMetricsDataDeletionId;
    if (deleteRegulationId.length === 0) {
      throw new Error('Delete Regulation id not found');
    }

    const { data } =
      await this.#dataDeletionService.fetchDeletionRegulationStatus(
        deleteRegulationId,
      );

    const regulation = data?.regulation;
    this.update((state) => {
      state.metaMetricsDataDeletionStatus =
        regulation.overallStatus as DeleteRegulationStatus;

      return state;
    });
  }
}
