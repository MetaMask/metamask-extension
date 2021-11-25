import React, { useContext } from 'react';
import { I18nContext } from '../../../contexts/i18n';

const PERMISSION_TYPES = {
  eth_accounts: {
    leftIcon: 'fas fa-eye',
    label: 'eth_accounts',
    rightIcon: null,
  },
};

function Permission({ leftIcon, label, rightIcon = null }) {
  const t = useContext(I18nContext);
  return (
    <div className="permission">
      <i className={leftIcon} />
      {t(label)}
      <i className={rightIcon} />
    </div>
  );
}

export default function PermissionsConnectPermissionList({ permissions }) {
  return (
    <div class="permissions-connect-permission-list">
      {Object.keys(permissions).map((permission) => PERMISSION_TYPES[permission]).map((permission) => (
        <Permission
          leftIcon={permission.leftIcon}
          label={permission.label}
          rightIcon={permission.rightIcon}
        />
      ))}
    </div>
  );
}
