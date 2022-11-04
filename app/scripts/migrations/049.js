import { cloneDeep } from 'lodash';

const version = 49;

/**
 * Migrate metaMetrics state to the new MetaMetrics controller
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

function transformState(state = {}) {
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
