import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 49;

type LegacyPreferencesController = {
  metaMetricsId?: string;
  participateInMetaMetrics?: boolean;
  metaMetricsSendCount?: number;
  [key: string]: unknown;
};

type LegacyMetaMetricsController = {
  metaMetricsId?: string;
  participateInMetaMetrics?: boolean;
  metaMetricsSendCount?: number;
  [key: string]: unknown;
};

type LegacyState = MigrationState['data'] &
  Partial<Record<'PreferencesController', LegacyPreferencesController>> &
  Partial<Record<'MetaMetricsController', LegacyMetaMetricsController>>;

/**
 * Migrate metaMetrics state to the new MetaMetrics controller
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState = {}): LegacyState {
  if (state.PreferencesController) {
    const { metaMetricsId, participateInMetaMetrics, metaMetricsSendCount } =
      state.PreferencesController;
    state.MetaMetricsController = state.MetaMetricsController ?? {};

    if (metaMetricsId !== undefined) {
      state.MetaMetricsController.metaMetricsId = metaMetricsId;
      delete state.PreferencesController.metaMetricsId;
    }

    if (participateInMetaMetrics !== undefined) {
      state.MetaMetricsController.participateInMetaMetrics =
        participateInMetaMetrics;
      delete state.PreferencesController.participateInMetaMetrics;
    }

    if (metaMetricsSendCount !== undefined) {
      state.MetaMetricsController.metaMetricsSendCount = metaMetricsSendCount;
      delete state.PreferencesController.metaMetricsSendCount;
    }
  }
  return state;
}
