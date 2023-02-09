import React from 'react';
import PropTypes from 'prop-types';
import { getWeightedPermissions } from '../../../helpers/utils/permission';
import { useI18nContext } from '../../../hooks/useI18nContext';

/**
 * Get one or more permission descriptions for a permission name.
 *
 * @param permission - The permission to render.
 * @param permission.label - The text label.
 * @param permission.leftIcon - The left icon.
 * @param permission.rightIcon - The right icon.
 * @param permission.permissionName - The name of the permission.
 * @param index - The index of the permission in the permissions array.
 * @returns {JSX.Element[]} An array of permission description nodes.
 */
function getDescriptionNode(
  { label, leftIcon, rightIcon, permissionName },
  index,
) {
  return (
    <div className="permission" key={`${permissionName}-${index}`}>
      <i className={leftIcon} />
      {label}
      {rightIcon && <i className={rightIcon} />}
    </div>
  );
}

export default function PermissionsConnectPermissionList({ permissions }) {
  const t = useI18nContext();

  return (
    <div className="permissions-connect-permission-list">
      {getWeightedPermissions(t, permissions).map(getDescriptionNode)}
    </div>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.object.isRequired,
};
