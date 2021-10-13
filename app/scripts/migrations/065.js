import { cloneDeep } from 'lodash';

const version = 65;

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
  if (state.PreferencesController) {
    const { completedOnboarding } = state.PreferencesController;
    if (completedOnboarding !== undefined) {
      state.OnboardingController.completedOnboarding = completedOnboarding;
      delete state.PreferencesController.completedOnboarding;
    }
  }
  return state;
}
