import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 215;

const OBSOLETE_UI_APP_STATE_PROPERTIES = ['importTokensModalOpen'] as const;

/**
 * Migration 215: remove the legacy import tokens modal flag from persisted UI
 * app state now that the old token import modal flow has been removed.
 *
 * @param versionedData - Versioned MetaMask extension state; what we persist to disk.
 * @param changedControllers - A set used to record state keys that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const changedUiStateKeys = removeObsoleteUiAppStateProperties(
    versionedData.data,
  );
  for (const key of changedUiStateKeys) {
    changedControllers.add(key);
  }
}) satisfies Migrate;

export default migrate;

function removeObsoleteUiAppStateProperties(
  state: Record<string, unknown>,
): Set<string> {
  const changedKeys = new Set<string>();
  const possibleStates = [
    { key: 'metamask', value: state },
    {
      key: 'metamask',
      value:
        hasProperty(state, 'metamask') && isObject(state.metamask)
          ? state.metamask
          : undefined,
    },
    {
      key: 'appState',
      value:
        hasProperty(state, 'appState') && isObject(state.appState)
          ? state.appState
          : undefined,
    },
  ];

  for (const { key, value } of possibleStates) {
    if (!isObject(value)) {
      continue;
    }

    let changed = false;
    for (const property of OBSOLETE_UI_APP_STATE_PROPERTIES) {
      if (hasProperty(value, property)) {
        delete value[property];
        changed = true;
      }
    }
    if (changed) {
      changedKeys.add(key);
    }
  }

  return changedKeys;
}
