import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 38;

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'ABTestController',
      {
        abTests?: Record<string, string>;
      }
    >
  >;

/**
 * The purpose of this migration is to assign all users to a test group for the fullScreenVsPopup a/b test
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

function transformState(state: LegacyState): LegacyState {
  const { ABTestController: ABTestControllerState = {} } = state;
  const { abTests = {} } = ABTestControllerState;

  if (abTests.fullScreenVsPopup) {
    return state;
  }

  return {
    ...state,
    ABTestController: {
      ...ABTestControllerState,
      abTests: {
        ...abTests,
        fullScreenVsPopup: 'control',
      },
    },
  };
}
