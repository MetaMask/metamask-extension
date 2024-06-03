import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import type { DataDeletionService } from '../../services/data-deletion-service';

// Unique name for the controller
const controllerName = 'MetaMetricsDataDeletionController';

/**
 * Get a type representing the public interface of the given type. The
 * returned type will have all public properties, but will omit private
 * properties.
 *
 * @template Interface - The interface to return a public representation of.
 */
type PublicInterface<Interface> = Pick<Interface, keyof Interface>;

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
 * The status on which to filter the returned regulations.
 * Mentioned here: https://docs.segmentapis.com/tag/Deletion-and-Suppression#operation/listRegulationsFromSource
 *
 * @type DeleteRegulationStatus
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
 * @property hasMetaMetricsDataRecorded - optional variable which records whether data was collected after last deletion
 */
export type MetaMetricsDataDeletionState = {
  metaMetricsDataDeletionId: DataDeleteRegulationId;
  metaMetricsDataDeletionDate: DataDeleteDate;
  metaMetricsDataDeletionStatus?: DeleteRegulationStatus;
  hasMetaMetricsDataRecorded?: boolean;
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
  hasMetaMetricsDataRecorded: {
    persist: true,
    anonymous: true,
  },
};

// Describes the action creating the delete regulation task
export type CreateMetaMetricsDataDeletionTaskAction = {
  type: `${typeof controllerName}:createMetaMetricsDataDeletionTask`;
  handler: MetaMetricsDataDeletionController['createMetaMetricsDataDeletionTask'];
};

// Describes the action to check the existing regulation status
export type UpdateDataDeletionTaskStatusAction = {
  type: `${typeof controllerName}:updateDataDeletionTaskStatus`;
  handler: MetaMetricsDataDeletionController['updateDataDeletionTaskStatus'];
};

// Describes the action to records whether data was collected after last deletion
export type SetHasMetaMetricsDataRecordedAction = {
  type: `${typeof controllerName}:setHasMetaMetricsDataRecorded`;
  handler: MetaMetricsDataDeletionController['setHasMetaMetricsDataRecorded'];
};

// Union of all possible actions for the messenger
export type MetaMetricsDataDeletionControllerMessengerActions =
  | CreateMetaMetricsDataDeletionTaskAction
  | UpdateDataDeletionTaskStatusAction
  | SetHasMetaMetricsDataRecordedAction;

// Type for the messenger of MetaMetricsDataDeletionController
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
export class MetaMetricsDataDeletionController extends BaseController<
  typeof controllerName,
  MetaMetricsDataDeletionState,
  MetaMetricsDataDeletionControllerMessenger
> {
  #dataDeletionService: PublicInterface<DataDeletionService>;

  #getMetaMetricsId: () => string | null;

  /**
   * Creates a MetaMetricsDataDeletionController instance.
   *
   * @param args - The arguments to this function.
   * @param args.dataDeletionService - The service used for deleting data.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   * @param args.getMetaMetricsId - A function that returns the current MetaMetrics ID.
   */
  constructor({
    dataDeletionService,
    messenger,
    state,
    getMetaMetricsId,
  }: {
    dataDeletionService: PublicInterface<DataDeletionService>;
    messenger: MetaMetricsDataDeletionControllerMessenger;
    state?: MetaMetricsDataDeletionState;
    getMetaMetricsId: () => string | null;
  }) {
    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });
    this.#getMetaMetricsId = getMetaMetricsId;
    this.#dataDeletionService = dataDeletionService;
  }

  /**
   * Creating the delete regulation using source regulation
   *
   */
  async createMetaMetricsDataDeletionTask(): Promise<void> {
    const metaMetricsId = this.#getMetaMetricsId();
    if (!metaMetricsId) {
      throw new Error('MetaMetrics ID not found');
    }

    const { data } =
      await this.#dataDeletionService.createDataDeletionRegulationTask(
        metaMetricsId,
      );
    this.update((state) => {
      state.metaMetricsDataDeletionId = data?.regulateId;
      state.metaMetricsDataDeletionDate = Date.now();
      return state;
    });
    await this.updateDataDeletionTaskStatus();
  }

  /**
   * To check the status of the current delete regulation.
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

  /**
   * To records whether data was collected after last deletion
   *
   * @param record - boolean value to determine data is being recorded.
   */
  setHasMetaMetricsDataRecorded(record: boolean): void {
    this.update((state) => {
      state.hasMetaMetricsDataRecorded = record;
      return state;
    });
  }
}
