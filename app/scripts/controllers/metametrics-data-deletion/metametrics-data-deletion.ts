import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { PublicInterface } from '@metamask/utils';
import type { DataDeletionService } from '../../services/data-deletion-service';
import { DeleteRegulationStatus } from '../../../../shared/constants/metametrics';
import { MetaMetricsControllerGetStateAction } from '../metametrics-controller';

// Unique name for the controller
const controllerName = 'MetaMetricsDataDeletionController';

/**
 * Timestamp at which regulation response is returned.
 */
export type DataDeleteTimestamp = number;
/**
 * Regulation Id retuned while creating a delete regulation.
 */
export type DataDeleteRegulationId = string | null;

/**
 * MetaMetricsDataDeletionController controller state
 * metaMetricsDataDeletionId - Regulation Id retuned while creating a delete regulation.
 * metaMetricsDataDeletionTimestamp - Timestamp at which the most recent regulation is created/requested for.
 * metaMetricsDataDeletionStatus - Status of the current delete regulation.
 */
export type MetaMetricsDataDeletionState = {
  metaMetricsDataDeletionId: DataDeleteRegulationId;
  metaMetricsDataDeletionTimestamp: DataDeleteTimestamp;
  metaMetricsDataDeletionStatus?: DeleteRegulationStatus;
};

const getDefaultState = (): MetaMetricsDataDeletionState => {
  return {
    metaMetricsDataDeletionId: null,
    metaMetricsDataDeletionTimestamp: 0,
  };
};

// Metadata for the controller state
const metadata = {
  metaMetricsDataDeletionId: {
    persist: true,
    anonymous: true,
  },
  metaMetricsDataDeletionTimestamp: {
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

// Describes the action to check the existing regulation status
export type UpdateDataDeletionTaskStatusAction = {
  type: `${typeof controllerName}:updateDataDeletionTaskStatus`;
  handler: MetaMetricsDataDeletionController['updateDataDeletionTaskStatus'];
};

// Union of all possible actions for the messenger
export type MetaMetricsDataDeletionControllerMessengerActions =
  | CreateMetaMetricsDataDeletionTaskAction
  | UpdateDataDeletionTaskStatusAction;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions = MetaMetricsControllerGetStateAction;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents = never;

// Type for the messenger of MetaMetricsDataDeletionController
export type MetaMetricsDataDeletionControllerMessenger =
  RestrictedControllerMessenger<
    typeof controllerName,
    MetaMetricsDataDeletionControllerMessengerActions | AllowedActions,
    AllowedEvents,
    AllowedActions['type'],
    AllowedEvents['type']
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

  /**
   * Creates a MetaMetricsDataDeletionController instance.
   *
   * @param args - The arguments to this function.
   * @param args.dataDeletionService - The service used for deleting data.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   */
  constructor({
    dataDeletionService,
    messenger,
    state,
  }: {
    dataDeletionService: PublicInterface<DataDeletionService>;
    messenger: MetaMetricsDataDeletionControllerMessenger;
    state?: Partial<MetaMetricsDataDeletionState>;
  }) {
    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...getDefaultState(), ...state },
    });
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
    const { metaMetricsId } = this.messagingSystem.call(
      'MetaMetricsController:getState',
    );
    if (!metaMetricsId) {
      throw new Error('MetaMetrics ID not found');
    }

    const deleteRegulateId =
      await this.#dataDeletionService.createDataDeletionRegulationTask(
        metaMetricsId,
      );
    this.update((state) => {
      state.metaMetricsDataDeletionId = deleteRegulateId ?? null;
      state.metaMetricsDataDeletionTimestamp = Date.now();
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
