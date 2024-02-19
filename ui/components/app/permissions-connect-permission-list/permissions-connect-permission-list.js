import React from 'react';
import PropTypes from 'prop-types';
import {
  getRightIcon,
  getWeightedPermissions,
} from '../../../helpers/utils/permission';
import { useI18nContext } from '../../../hooks/useI18nContext';

/**
 * Get one or more permission descriptions for a permission name.
 *
 * @param permission - The permission to render.
 * @param index - The index of the permission.
 * @returns {JSX.Element} A permission description node.
 */
function getDescriptionNode(permission, index) {
  const { label, leftIcon, permissionName } = permission;

  return (
    <div className="permission" key={`${permissionName}-${index}`}>
      {typeof leftIcon === 'string' ? <i className={leftIcon} /> : leftIcon}
      {label}
      {getRightIcon(permission)}
    </div>
  );
}

export default function PermissionsConnectPermissionList({
  permissions,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

  return (
    <div className="permissions-connect-permission-list">
      {getWeightedPermissions(t, permissions, targetSubjectMetadata).map(
        getDescriptionNode,
      )}
    </div>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.object.isRequired,
  targetSubjectMetadata: PropTypes.object.isRequired,
};
