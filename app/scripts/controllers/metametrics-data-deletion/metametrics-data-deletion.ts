import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import { PublicInterface } from '@metamask/utils';
import type { DataDeletionService } from '../../services/data-deletion-service';
import { DeleteRegulationStatus } from '../../../../shared/constants/metametrics';
import { MetaMetricsControllerGetStateAction } from '../metametrics-controller';
import { MetaMetricsDataDeletionControllerMethodActions } from './metametrics-data-deletion-method-action-types';

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
const metadata: StateMetadata<MetaMetricsDataDeletionState> = {
  metaMetricsDataDeletionId: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  metaMetricsDataDeletionTimestamp: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  metaMetricsDataDeletionStatus: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
};

const MESSENGER_EXPOSED_METHODS = [
  'createMetaMetricsDataDeletionTask',
  'updateDataDeletionTaskStatus',
] as const;

export type MetaMetricsDataDeletionControllerGetStateAction =
  ControllerGetStateAction<typeof controllerName, MetaMetricsDataDeletionState>;

// Union of all possible actions for the messenger
export type MetaMetricsDataDeletionControllerMessengerActions =
  | MetaMetricsDataDeletionControllerGetStateAction
  | MetaMetricsDataDeletionControllerMethodActions;

export type MetaMetricsDataDeletionControllerMessengerEvents =
  ControllerStateChangeEvent<
    typeof controllerName,
    MetaMetricsDataDeletionState
  >;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions = MetaMetricsControllerGetStateAction;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents = never;

// Type for the messenger of MetaMetricsDataDeletionController
export type MetaMetricsDataDeletionControllerMessenger = Messenger<
  typeof controllerName,
  MetaMetricsDataDeletionControllerMessengerActions | AllowedActions,
  MetaMetricsDataDeletionControllerMessengerEvents | AllowedEvents
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
    this.messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  /**
   * Creating the delete regulation using source regulation
   *
   */
  async createMetaMetricsDataDeletionTask(): Promise<void> {
    const { metaMetricsId } = this.messenger.call(
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
