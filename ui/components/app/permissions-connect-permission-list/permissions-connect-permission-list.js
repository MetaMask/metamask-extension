import React from 'react';
import PropTypes from 'prop-types';
import { getPermissionDescription } from '../../../helpers/utils/permission';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function PermissionsConnectPermissionList({ permissions }) {
  const t = useI18nContext();

  return (
    <div className="permissions-connect-permission-list">
      {Object.keys(permissions).map((permission) => {
        const { label, leftIcon, rightIcon } = getPermissionDescription(
          t,
          permission,
        );

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
