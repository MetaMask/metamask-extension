import { useMemo } from 'react';
import {
  RestrictedMethods,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  EndowmentPermissions,
  PermissionNamespaces,
  ///: END:ONLY_INCLUDE_IN
} from '../../shared/constants/permissions';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { coinTypeToProtocolName } from '../helpers/utils/util';
///: END:ONLY_INCLUDE_IN
import { useI18nContext } from './useI18nContext';

const UNKNOWN_PERMISSION = Symbol('unknown');

/**
 * @typedef {Object} PermissionLabelObject
 * @property {string} label - The text label.
 * @property {string} leftIcon - The left icon.
 * @property {string} rightIcon - The right icon.
 */

/**
 * @returns {(permissionName:string) => PermissionLabelObject}
 */
export const usePermissionDescriptions = () => {
  const t = useI18nContext();

  return useMemo(() => {
    const permissionDescriptions = {
      [RestrictedMethods.eth_accounts]: {
        leftIcon: 'fas fa-eye',
        label: t('permission_ethereumAccounts'),
        rightIcon: null,
      },
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      [RestrictedMethods.snap_confirm]: {
        leftIcon: 'fas fa-user-check',
        label: t('permission_customConfirmation'),
        rightIcon: null,
      },
      [RestrictedMethods['snap_getBip44Entropy_*']]: (permissionName) => {
        const coinType = permissionName.split('_').slice(-1);
        return {
          leftIcon: 'fas fa-door-open',
          label: t('permission_manageBip44Keys', [
            coinTypeToProtocolName(coinType) ||
              `${coinType} (Unrecognized protocol)`,
          ]),
          rightIcon: null,
        };
      },
      [RestrictedMethods.snap_manageState]: {
        leftIcon: 'fas fa-download',
        label: t('permission_manageState'),
        rightIcon: null,
      },
      [RestrictedMethods['wallet_snap_*']]: (permissionName) => {
        const snapId = permissionName.split('_').slice(-1);
        return {
          leftIcon: 'fas fa-bolt',
          label: t('permission_accessSnap', [snapId]),
          rightIcon: null,
        };
      },
      [EndowmentPermissions['endowment:network-access']]: {
        leftIcon: 'fas fa-wifi',
        label: t('permission_accessNetwork'),
        rightIcon: null,
      },
      ///: END:ONLY_INCLUDE_IN
      [UNKNOWN_PERMISSION]: (permissionName) => {
        return {
          leftIcon: 'fas fa-times-circle',
          label: t('permission_unknown', [permissionName ?? 'undefined']),
          rightIcon: null,
        };
      },
    };

    return (permissionName) => {
      let value = permissionDescriptions[UNKNOWN_PERMISSION];

      if (Object.hasOwnProperty.call(permissionDescriptions, permissionName)) {
        value = permissionDescriptions[permissionName];
      }
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      for (const namespace of Object.keys(PermissionNamespaces)) {
        if (permissionName.startsWith(namespace)) {
          value = permissionDescriptions[PermissionNamespaces[namespace]];
        }
      }
      ///: END:ONLY_INCLUDE_IN

      return typeof value === 'function' ? value(permissionName) : value;
    };
  }, [t]);
};
