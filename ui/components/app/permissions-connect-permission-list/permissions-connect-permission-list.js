import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function PermissionsConnectPermissionList({ permissions }) {
  const t = useI18nContext();

  const PERMISSION_TYPES = {
    eth_accounts: {
      leftIcon: 'fas fa-eye',
      label: t('eth_accounts'),
      rightIcon: null,
    },
  };

  return (
    <div className="permissions-connect-permission-list">
      {Object.keys(permissions)
        .map((permission) => PERMISSION_TYPES[permission])
        .map((permission) => (
          <div className="permission" key={permission.label}>
            <i className={permission.leftIcon} />
            {permission.label}
            <i className={permission.rightIcon} />
          </div>
        ))}
    </div>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.objectOf(PropTypes.bool).isRequired,
};
