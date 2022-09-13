import React from 'react';
import PropTypes from 'prop-types';
import { getPermissionDescription } from '../../../helpers/utils/permission';
import { useI18nContext } from '../../../hooks/useI18nContext';

/**
 * Get one or more permission descriptions for a permission name.
 *
 * @param t - The translation function.
 * @param permissionName - The name of the permission to request.
 * @param permissionValue - The value of the permission to request.
 * @returns {JSX.Element[]} An array of permission description nodes.
 */
function getDescriptionNodes(t, permissionName, permissionValue) {
  const { label, leftIcon, rightIcon } = getPermissionDescription(
    t,
    permissionName,
    permissionValue,
  );

  if (Array.isArray(label)) {
    return label.map((labelValue, index) => (
      <div className="permission" key={`${permissionName}-${index}`}>
        <i className={leftIcon} />
        {labelValue}
        {rightIcon && <i className={rightIcon} />}
      </div>
    ));
  }

  return [
    <div className="permission" key={permissionName}>
      <i className={leftIcon} />
      {label}
      {rightIcon && <i className={rightIcon} />}
    </div>,
  ];
}

export default function PermissionsConnectPermissionList({ permissions }) {
  const t = useI18nContext();

  return (
    <div className="permissions-connect-permission-list">
      {Object.entries(permissions).reduce(
        (target, [permissionName, permissionValue]) =>
          target.concat(
            getDescriptionNodes(t, permissionName, permissionValue),
          ),
        [],
      )}
    </div>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.object.isRequired,
};
