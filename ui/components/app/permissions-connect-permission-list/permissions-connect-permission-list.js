import React from 'react';
import PropTypes from 'prop-types';
import { usePermissionDescriptions } from '../../../hooks/usePermissionDescriptions';

export default function PermissionsConnectPermissionList({ permissions }) {
  const getPermissionDescription = usePermissionDescriptions();

  return (
    <div className="permissions-connect-permission-list">
      {Object.keys(permissions).map((permission) => {
        const { label, leftIcon, rightIcon } = getPermissionDescription(
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
