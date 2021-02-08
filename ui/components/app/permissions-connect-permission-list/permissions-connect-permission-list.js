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

  return (
    <div className="permissions-connect-permission-list">
      {Object.keys(permissions).map((permission) => (
        <div className="permission" key={PERMISSION_TYPES[permission].label}>
          <i className={PERMISSION_TYPES[permission].leftIcon} />
          {PERMISSION_TYPES[permission].label}
          <i className={PERMISSION_TYPES[permission].rightIcon} />
        </div>
      ))}
    </div>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.objectOf(PropTypes.bool).isRequired,
};
