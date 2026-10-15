// next version number
/*

Cleans up notices and assocated notice controller code

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 33;

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'NoticeController',
      {
        noticesList?: {
          id: number;
          read: boolean;
          date?: string;
          title: string;
          body: string;
        }[];
      }
    >
  >;

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

function transformState(state: LegacyState): LegacyState {
  const newState = state;
  // transform state here
  if (state.NoticeController) {
    delete newState.NoticeController;
  }
  return newState;
}
