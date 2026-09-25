/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 65;

/**
 * Removes metaMetricsSendCount from MetaMetrics controller
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
  if (state.PreferencesController) {
    const { completedOnboarding, firstTimeFlowType } =
      state.PreferencesController;
    state.OnboardingController = state.OnboardingController ?? {};

    if (completedOnboarding !== undefined) {
      state.OnboardingController.completedOnboarding = completedOnboarding;
      delete state.PreferencesController.completedOnboarding;
    }
    if (firstTimeFlowType !== undefined) {
      state.OnboardingController.firstTimeFlowType = firstTimeFlowType;
      delete state.PreferencesController.firstTimeFlowType;
    }
  }

  return state;
}
