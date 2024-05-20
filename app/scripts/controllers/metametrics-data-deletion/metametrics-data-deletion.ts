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

  async createMetaMetricsDataDeletionTask(): Promise<void> {
    const { metaMetricsId } = this.metaMetricsController.store.getState();
    if (!metaMetricsId) {
      throw new Error('MetaMetrics ID not found');
    }

    try {
      const { data } = await createDataDeletionRegulationTask(
        metaMetricsId as string,
      );
      this.store.updateState({
        metaMetricsDataDeletionId: data?.regulateId as string,
        metaMetricsDataDeletionDate: this._formatDeletionDate(),
      });
      await this.checkDataDeletionTaskStatus();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error ?? '');
      throw new Error(`Metametrics Data Deletion Error: ${errorMessage}`);
    }
  }

  async checkDataDeletionTaskStatus(): Promise<void> {
    const deleteRegulationId = this.store.getState().metaMetricsDataDeletionId;
    if (deleteRegulationId.length === 0) {
      throw new Error('Delete Regulation id not found');
    }

    try {
      const { data } = await fetchDeletionRegulationStatus(deleteRegulationId);

      const regulation = data?.regulation as Record<string, string>;
      this.store.updateState({
        metaMetricsDataDeletionStatus:
          regulation.overallStatus as DeleteRegulationStatus,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error ?? '');
      throw new Error(`Metametrics Data Deletion Error: ${errorMessage}`);
    }
  }
}
