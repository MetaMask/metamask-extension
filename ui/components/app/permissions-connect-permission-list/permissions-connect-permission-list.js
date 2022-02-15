import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  RestrictedMethods,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  EndowmentPermissions,
  PermissionNamespaces,
  ///: END:ONLY_INCLUDE_IN
} from '../../../../shared/constants/permissions';
import { useI18nContext } from '../../../hooks/useI18nContext';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { coinTypeToProtocolName } from '../../../helpers/utils/util';
///: END:ONLY_INCLUDE_IN

const UNKNOWN_PERMISSION = Symbol('unknown');

/**
 * @typedef {Object} PermissionLabelObject
 * @property {string} label - The text label.
 * @property {string} leftIcon - The left icon.
 * @property {string} rightIcon - The right icon.
 */

/**
 * Gets the permission list label dictionary key for the specified permission
 * name.
 *
 * @param {string} permissionName - The name of the permission whose key to
 * retrieve.
 * @param {Record<string, PermissionLabelObject>} permissionDictionary - The
 * dictionary object mapping permission keys to label objects.
 */
function getPermissionKey(permissionName, permissionDictionary) {
  if (Object.hasOwnProperty.call(permissionDictionary, permissionName)) {
    return permissionName;
  }
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  for (const namespace of Object.keys(PermissionNamespaces)) {
    if (permissionName.startsWith(namespace)) {
      return PermissionNamespaces[namespace];
    }
  }
  ///: END:ONLY_INCLUDE_IN

  return UNKNOWN_PERMISSION;
}

export default function PermissionsConnectPermissionList({ permissions }) {
  const t = useI18nContext();

  const PERMISSION_LIST_VALUES = useMemo(() => {
    return {
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
  }, [t]);

  return (
    <div className="permissions-connect-permission-list">
      {Object.keys(permissions).map((permission) => {
        const listValue =
          PERMISSION_LIST_VALUES[
            getPermissionKey(permission, PERMISSION_LIST_VALUES)
          ];

        const { label, leftIcon, rightIcon } =
          typeof listValue === 'function' ? listValue(permission) : listValue;

        return (
          <div className="permission" key={permission}>
            <i className={leftIcon} />
            {label}
            {rightIcon && <i className={rightIcon} />}
          </div>
        );
      })}
    </div>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.object.isRequired,
};
