import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState } from './legacy-migration-utils';
const version = 65;

/**
 * Removes metaMetricsSendCount from MetaMetrics controller
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
} satisfies LegacyMigration;

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
