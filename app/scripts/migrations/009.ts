/*

This migration breaks out the CurrencyController substate

*/

import { cloneDeep, merge } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 9;

type LegacyState = MigrationState['data'] & {
  conversionDate?: number;
  conversionRate?: number;
  currentFiat?: string;
  fiatCurrency?: string;
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
    CurrencyController: {
      currentCurrency: state.currentFiat || state.fiatCurrency || 'USD',
      conversionRate: state.conversionRate,
      conversionDate: state.conversionDate,
    },
  });
  delete newState.currentFiat;
  delete newState.fiatCurrency;
  delete newState.conversionRate;
  delete newState.conversionDate;

  return newState;
}
