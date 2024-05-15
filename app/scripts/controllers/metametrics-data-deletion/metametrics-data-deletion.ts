import { ObservableStore } from '@metamask/obs-store';
import MetaMetricsController from '../metametrics';
import {
  createDataDeletionRegulationTask,
  fetchDeletionRegulationStatus,
} from './services/services';

export type DataDeleteDate = string | undefined;
export type DataDeleteRegulationId = string | undefined;

export type RegulationId = Record<string, string>;
export type CurrentRegulationStatus = Record<string, Record<string, string>>;
export type DeleteRegulationAPIResponse = {
  data: Record<string, RegulationId | CurrentRegulationStatus>;
};

export enum responseStatus {
  ok = 'ok',
  error = 'error',
}

export type DataDeletionResponse = {
  status: responseStatus;
  metaMetricsDataDeletionStatus?: string | null;
  error?: string;
};

export type MetaMetricsDataDeletionState = {
  metaMetricsDataDeletionId: DataDeleteRegulationId;
  metaMetricsDataDeletionDate: DataDeleteDate;
};

const defaultState: MetaMetricsDataDeletionState = {
  metaMetricsDataDeletionId: undefined,
  metaMetricsDataDeletionDate: undefined,
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
    const segmentSourceId = process.env.SEGMENT_DELETE_API_SOURCE_ID;
    const segmentRegulationEndpoint = process.env.SEGMENT_REGULATIONS_ENDPOINT;

    if (!segmentSourceId || !segmentRegulationEndpoint) {
      return {
        status: responseStatus.error,
        error: 'Segment API source ID or endpoint not found',
      };
    }
    const { metaMetricsId } = this.metaMetricsController.store.getState();

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
    const segmentRegulationEndpoint = process.env.SEGMENT_REGULATIONS_ENDPOINT;

    if (!segmentRegulationEndpoint) {
      return {
        status: responseStatus.error,
        error: 'Segment API source ID or endpoint not found',
      };
    }
    try {
      const { data } = await fetchDeletionRegulationStatus(
        this.store.getState().metaMetricsDataDeletionId as string,
      );
      const regulation = data?.data?.regulation as Record<string, string>;

      return {
        status: responseStatus.ok,
        metaMetricsDataDeletionStatus: regulation.overallStatus,
      };
    } catch (error: unknown) {
      return {
        status: responseStatus.error,
        error: error as string,
      };
    }
  }
}
