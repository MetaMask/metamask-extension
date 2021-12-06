import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function PermissionsConnectPermissionList({ permissions }) {
  const t = useI18nContext();

  const PERMISSION_TYPES = useMemo(() => {
    return {
      eth_accounts: {
        leftIcon: 'fas fa-eye',
        label: t('eth_accounts'),
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
