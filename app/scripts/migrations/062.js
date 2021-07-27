import { cloneDeep } from 'lodash';

const version = 62;

/**
 * Removes metaMetricsSendCount from MetaMetrics controller
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  if (state.MetaMetricsController) {
    const { metaMetricsSendCount } = state.MetaMetricsController;
    if (metaMetricsSendCount !== undefined) {
      delete state.MetaMetricsController.metaMetricsSendCount;
    }
  }
  return state;
}
