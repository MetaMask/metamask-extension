/*

This migration breaks out the NoticeController substate

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 8;

type LegacyNotice = {
  title: string;
  body: string;
  read: boolean;
};

type LegacyState = MigrationState['data'] & {
  noticesList?: LegacyNotice[];
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
  const newState = {
    ...state,
    NoticeController: {
      noticesList: state.noticesList || [],
    },
  };
  delete newState.noticesList;

  return newState;
}
