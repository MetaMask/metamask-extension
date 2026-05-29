import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 208;

const OBSOLETE_APP_STATE_PROPERTIES = [
  'isRampCardClosed',
  'nftsDetectionNoticeDismissed',
  'showAccountBanner',
  'showBetaHeader',
  'showNetworkBanner',
  'showPermissionsTour',
  'showTestnetMessageInDropdown',
  'surveyLinkLastClickedOrClosed',
] as const;

const OBSOLETE_UI_APP_STATE_PROPERTIES = [
  'accountDetailsAddress',
  'buyView',
  'currentWindowTab',
  'menuOpen',
  'networksTabSelectedRpcUrl',
  'newNftAddedMessage',
  'removeNftMessage',
  'scrollToBottom',
  'shouldClose',
  'showCopyAddressToast',
  'showNewSrpAddedToast',
  'showNftDetectionEnablementToast',
  'showPasswordChangeToast',
  'showTermsOfUsePopup',
  'snapsInstallPrivacyWarningShown',
  'welcomeScreenSeen',
] as const;

/**
 * Removes obsolete AppStateController properties that no longer have product
 * code paths that can read or update them, and obsolete UI app state
 * properties that may still exist in legacy persisted state.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const didRemoveAppStateControllerProperties =
    removeObsoleteAppStateControllerProperties(versionedData.data);
  if (didRemoveAppStateControllerProperties) {
    changedControllers.add('AppStateController');
  }

  const changedUiStateKeys = removeObsoleteUiAppStateProperties(
    versionedData.data,
  );
  for (const key of changedUiStateKeys) {
    changedControllers.add(key);
  }
}) satisfies Migrate;

function removeObsoleteAppStateControllerProperties(
  state: Record<string, unknown>,
): boolean {
  if (
    !hasProperty(state, 'AppStateController') ||
    !isObject(state.AppStateController)
  ) {
    return false;
  }

  const { AppStateController } = state;
  let changed = false;

  for (const property of OBSOLETE_APP_STATE_PROPERTIES) {
    if (hasProperty(AppStateController, property)) {
      delete AppStateController[property];
      changed = true;
    }
  }

  return changed;
}

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
