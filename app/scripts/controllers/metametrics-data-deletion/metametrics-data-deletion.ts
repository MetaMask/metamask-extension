import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import type { DataDeletionService } from '../../services/data-deletion-service';
import { DeleteRegulationStatus } from '../../../../shared/constants/metametrics';

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
 * Timestamp at which regulation response is returned.
 */
export type DataDeleteDate = number;
/**
 * Regulation Id retuned while creating a delete regulation.
 */
export type DataDeleteRegulationId = string | null;

/**
 * MetaMetricsDataDeletionController controller state
 * metaMetricsDataDeletionId - Regulation Id retuned while creating a delete regulation.
 * metaMetricsDataDeletionDate - Date at which the most recent regulation is created/requested for.
 * metaMetricsDataDeletionStatus - Status of the current delete regulation.
 * participateInDuringDeletion - optional variable which records whether data was collected after last deletion
 */
export type MetaMetricsDataDeletionState = {
  metaMetricsDataDeletionId: DataDeleteRegulationId;
  metaMetricsDataDeletionDate: DataDeleteDate;
  metaMetricsDataDeletionStatus?: DeleteRegulationStatus;
  participateInDuringDeletion: boolean | null;
};

const defaultState: MetaMetricsDataDeletionState = {
  metaMetricsDataDeletionId: null,
  metaMetricsDataDeletionDate: 0,
  participateInDuringDeletion: null,
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
  participateInDuringDeletion: {
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

// Union of all possible actions for the messenger
export type MetaMetricsDataDeletionControllerMessengerActions =
  | CreateMetaMetricsDataDeletionTaskAction
  | UpdateDataDeletionTaskStatusAction;

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

  #getParticipateInMetrics: () => boolean | null;

  /**
   * Creates a MetaMetricsDataDeletionController instance.
   *
   * @param args - The arguments to this function.
   * @param args.dataDeletionService - The service used for deleting data.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   * @param args.getMetaMetricsId - A function that returns the current MetaMetrics ID.
   * @param args.getParticipateInMetrics - A function that returns if user is currently participating in metametrics tracking.
   */
  constructor({
    dataDeletionService,
    messenger,
    state,
    getMetaMetricsId,
    getParticipateInMetrics,
  }: {
    dataDeletionService: PublicInterface<DataDeletionService>;
    messenger: MetaMetricsDataDeletionControllerMessenger;
    state?: Partial<MetaMetricsDataDeletionState>;
    getMetaMetricsId: () => string | null;
    getParticipateInMetrics: () => boolean | null;
  }) {
    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });
    this.#getMetaMetricsId = getMetaMetricsId;
    this.#getParticipateInMetrics = getParticipateInMetrics;
    this.#dataDeletionService = dataDeletionService;
    this.#registerMessageHandlers();
  }

  /**
   * Constructor helper for registering this controller's messaging system
   * actions.
   */
  #registerMessageHandlers(): void {
    this.messagingSystem.registerActionHandler(
      `${controllerName}:createMetaMetricsDataDeletionTask`,
      this.createMetaMetricsDataDeletionTask.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `${controllerName}:updateDataDeletionTaskStatus`,
      this.updateDataDeletionTaskStatus.bind(this),
    );
  }

  /**
   * Creating the delete regulation using source regulation
   *
   */
  async createMetaMetricsDataDeletionTask(): Promise<void> {
    const metaMetricsId = this.#getMetaMetricsId();
    const participateInMetrics = this.#getParticipateInMetrics();
    if (!metaMetricsId) {
      throw new Error('MetaMetrics ID not found');
    }

    const deleteRegulateId =
      await this.#dataDeletionService.createDataDeletionRegulationTask(
        metaMetricsId,
      );
    this.update((state) => {
      state.metaMetricsDataDeletionId = deleteRegulateId ?? null;
      state.metaMetricsDataDeletionDate = Date.now();
      state.participateInDuringDeletion = participateInMetrics;
    });
    await this.updateDataDeletionTaskStatus();
  }

  /**
   * To check the status of the current delete regulation.
   */
  async updateDataDeletionTaskStatus(): Promise<void> {
    const deleteRegulationId = this.state.metaMetricsDataDeletionId;
    if (!deleteRegulationId) {
      throw new Error('Delete Regulation id not found');
    }

    const deletionStatus =
      await this.#dataDeletionService.fetchDeletionRegulationStatus(
        deleteRegulationId,
      );

    this.update((state) => {
      state.metaMetricsDataDeletionStatus = deletionStatus ?? undefined;
    });
  }
}
