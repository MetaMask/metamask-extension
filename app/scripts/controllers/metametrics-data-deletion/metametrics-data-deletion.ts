import { ObservableStore } from '@metamask/obs-store';
import MetaMetricsController from '../metametrics';
import {
  createDataDeletionRegulationTask,
  fetchDeletionRegulationStatus,
} from './services/services';

export type DataDeleteDate = string;
export type DataDeleteRegulationId = string;

export type RegulationId = Record<string, string>;
export type CurrentRegulationStatus = Record<string, Record<string, string>>;
export type DeleteRegulationAPIResponse = {
  data: Record<string, RegulationId | CurrentRegulationStatus>;
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

export enum responseStatus {
  ok = 'ok',
  error = 'error',
}

export type DataDeletionResponse = {
  status: responseStatus;
  error?: string;
};

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

/**
 * Controller responsible for maintaining
 * state related to Metametrics data deletion
 */
export default class MetaMetricsDataDeletionController {
  /**
   * Observable store containing controller data.
   */
  store: ObservableStore<MetaMetricsDataDeletionState>;

  private metaMetricsController: MetaMetricsController;

  /**
   * Constructs a DeleteMetaMetricsData  controller.
   *
   * @param options - the controller options
   * @param options.initState - Initial controller state.
   * @param options.metaMetricsController
   */
  constructor({
    initState,
    metaMetricsController,
  }: {
    initState: MetaMetricsDataDeletionState;
    metaMetricsController: MetaMetricsController;
  }) {
    this.store = new ObservableStore({
      ...defaultState,
      ...initState,
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

  async createMetaMetricsDataDeletionTask(): Promise<DataDeletionResponse> {
    const { metaMetricsId } = this.metaMetricsController.store.getState();
    if (!metaMetricsId) {
      return {
        status: responseStatus.error,
        error: 'MetaMetrics ID not found',
      };
    }

    try {
      const { data } = await createDataDeletionRegulationTask(
        metaMetricsId as string,
      );

      this.store.updateState({
        metaMetricsDataDeletionId: data?.data?.regulateId as string,
        metaMetricsDataDeletionDate: this._formatDeletionDate(),
      });

      return { status: responseStatus.ok };
    } catch (error: unknown) {
      return {
        status: responseStatus.error,
        error: error as string,
      };
    }
  }

  async checkDataDeletionTaskStatus(): Promise<DataDeletionResponse> {
    const deleteRegulationId = this.store.getState().metaMetricsDataDeletionId;
    if (typeof deleteRegulationId && deleteRegulationId.length === 0) {
      return {
        status: responseStatus.error,
        error: 'Delete Regulation id not found',
      };
    }
    try {
      const { data } = await fetchDeletionRegulationStatus(deleteRegulationId);
      const regulation = data?.data?.regulation as Record<string, string>;
      this.store.updateState({
        metaMetricsDataDeletionStatus:
          regulation.overallStatus as DeleteRegulationStatus,
      });
      return {
        status: responseStatus.ok,
      };
    } catch (error: unknown) {
      return {
        status: responseStatus.error,
        error: error as string,
      };
    }
  }
}
