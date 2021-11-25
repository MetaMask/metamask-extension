import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';

const PERMISSION_TYPES = {
  eth_accounts: {
    leftIcon: 'fas fa-eye',
    label: 'eth_accounts',
    rightIcon: null,
  },
};

export default function PermissionsConnectPermissionList({ permissions }) {
  const t = useI18nContext();
  return (
    <div className="permissions-connect-permission-list">
      {Object.keys(permissions)
        .map((permission) => PERMISSION_TYPES[permission])
        .map((permission) => (
          <div className="permission" key={permission.label}>
            <i className={permission.leftIcon} />
            {t(permission.label)}
            <i className={permission.rightIcon} />
          </div>
        ))}
    </div>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.object.isRequired,
};
