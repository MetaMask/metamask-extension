/*

This migration modifies our notices to delete their body after being read.

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 12;

export default {
  version,

  migrate(originalVersionedData: MigrationState) {
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

type LegacyState = MigrationState['data'] &
  Record<
    'NoticeController',
    {
      noticesList: {
        body: string;
        read: boolean;
      }[];
    }
  >;

function transformState(state: LegacyState): LegacyState {
  const newState = state;
  newState.NoticeController.noticesList.forEach((notice) => {
    if (notice.read) {
      notice.body = '';
    }
  });
  return newState;
}
