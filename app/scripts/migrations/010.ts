/*

This migration breaks out the ShapeShiftController substate

*/

import { cloneDeep, merge } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 10;

type LegacyState = MigrationState['data'] & {
  shapeShiftTxList?: object[];
};

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data as LegacyState;
      const newState = transformState(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${(err as Error).stack}`);
    }
    return Promise.resolve(versionedData);
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState) {
  const newState = merge({}, state, {
    ShapeShiftController: {
      shapeShiftTxList: state.shapeShiftTxList || [],
    },
  });
  delete newState.shapeShiftTxList;

  return newState;
}
