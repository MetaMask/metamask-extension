import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';

const UNKNOWN_PERMISSION = Symbol('unknown');

export default function PermissionsConnectPermissionList({ permissions }) {
  const t = useI18nContext();

  // TODO:flask Fix Snap permission labels and support namespaced permissions
  const PERMISSION_TYPES = useMemo(() => {
    return {
      eth_accounts: {
        leftIcon: 'fas fa-eye',
        label: t('eth_accounts'),
        rightIcon: null,
      },
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      snap_confirm: {
        leftIcon: 'fas fa-eye',
        label: 'snap_confirm',
        rightIcon: null,
      },
      // TODO: We need a function to pass substitutions to `t` for this.
      'snap_getBip44Entropy_*': {
        leftIcon: 'fas fa-eye',
        label: 'snap_getBip44Entropy_*',
        rightIcon: null,
      },
      snap_manageState: {
        leftIcon: 'fas fa-eye',
        label: 'snap_manageState',
        rightIcon: null,
      },
      'wallet_snap_*': {
        leftIcon: 'fas fa-eye',
        label: 'wallet_snap_*',
        rightIcon: null,
      },
      ///: END:ONLY_INCLUDE_IN
      [UNKNOWN_PERMISSION]: {
        leftIcon: null,
        label: 'Unknown Permission',
        rightIcon: null,
      },
    };
  }, [t]);

  function getPermissionKey(permissionName) {
    if (PERMISSION_TYPES[permissionName]) {
      return permissionName;
    }
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    else if (permissionName.startsWith('wallet_snap_')) {
      return 'wallet_snap_*';
    } else if (permissionName.startsWith('snap_getBip44Entropy_')) {
      return 'snap_getBip44Entropy_*';
    }
    ///: END:ONLY_INCLUDE_IN

    return UNKNOWN_PERMISSION;
  }

  return (
    <div className="permissions-connect-permission-list">
      {Object.keys(permissions).map((permission) => {
        const { label, leftIcon, rightIcon } = PERMISSION_TYPES[
          getPermissionKey(permission)
        ];

        return (
          <div className="permission" key={label}>
            <i className={leftIcon} />
            {label}
            <i className={rightIcon} />
          </div>
        );
      })}
    </div>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.objectOf(PropTypes.bool).isRequired,
};
