import deepFreeze from 'deep-freeze-strict';
import {
  RestrictedMethods,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  EndowmentPermissions,
  PermissionNamespaces,
  ///: END:ONLY_INCLUDE_IN
} from '../../../shared/constants/permissions';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { coinTypeToProtocolName } from './util';
///: END:ONLY_INCLUDE_IN

const UNKNOWN_PERMISSION = Symbol('unknown');

const PERMISSION_DESCRIPTIONS = deepFreeze({
  [RestrictedMethods.eth_accounts]: {
    label: (t) => t('permission_ethereumAccounts'),
    leftIcon: 'fas fa-eye',
    rightIcon: null,
  },
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  [RestrictedMethods.snap_confirm]: {
    label: (t) => t('permission_customConfirmation'),
    leftIcon: 'fas fa-user-check',
    rightIcon: null,
  },
  [RestrictedMethods.snap_notify]: {
    leftIcon: 'fas fa-bell',
    label: (t) => t('permission_notifications'),
    rightIcon: null,
  },
  [RestrictedMethods['snap_getBip44Entropy_*']]: {
    label: (t, permissionName) => {
      const coinType = permissionName.split('_').slice(-1);
      return t('permission_manageBip44Keys', [
        coinTypeToProtocolName(coinType) ||
          `${coinType} (Unrecognized protocol)`,
      ]);
    },
    leftIcon: 'fas fa-door-open',
    rightIcon: null,
  },
  [RestrictedMethods.snap_manageState]: {
    label: (t) => t('permission_manageState'),
    leftIcon: 'fas fa-download',
    rightIcon: null,
  },
  [RestrictedMethods['wallet_snap_*']]: {
    label: (t, permissionName) => {
      const snapId = permissionName.split('_').slice(-1);
      return t('permission_accessSnap', [snapId]);
    },
    leftIcon: 'fas fa-bolt',
    rightIcon: null,
  },
  [EndowmentPermissions['endowment:network-access']]: {
    label: (t) => t('permission_accessNetwork'),
    leftIcon: 'fas fa-wifi',
    rightIcon: null,
  },
  [EndowmentPermissions['endowment:long-running']]: {
    label: (t) => t('permission_longRunning'),
    leftIcon: 'fas fa-infinity',
    rightIcon: null,
  },
  ///: END:ONLY_INCLUDE_IN
  [UNKNOWN_PERMISSION]: {
    label: (t, permissionName) =>
      t('permission_unknown', [permissionName ?? 'undefined']),
    leftIcon: 'fas fa-times-circle',
    rightIcon: null,
  },
});

/**
 * @typedef {object} PermissionLabelObject
 * @property {string} label - The text label.
 * @property {string} leftIcon - The left icon.
 * @property {string} rightIcon - The right icon.
 */

/**
 * @param {Function} t - The translation function
 * @param {string} permissionName - The name of the permission to request
 * @returns {(permissionName:string) => PermissionLabelObject}
 */
export const getPermissionDescription = (t, permissionName) => {
  let value = PERMISSION_DESCRIPTIONS[UNKNOWN_PERMISSION];

  if (Object.hasOwnProperty.call(PERMISSION_DESCRIPTIONS, permissionName)) {
    value = PERMISSION_DESCRIPTIONS[permissionName];
  }
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  for (const namespace of Object.keys(PermissionNamespaces)) {
    if (permissionName.startsWith(namespace)) {
      value = PERMISSION_DESCRIPTIONS[PermissionNamespaces[namespace]];
    }
  }
  ///: END:ONLY_INCLUDE_IN

  return { ...value, label: value.label(t, permissionName) };
};
