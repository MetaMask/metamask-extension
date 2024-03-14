import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { stripSnapPrefix } from '@metamask/snaps-utils';
import {
  getRightIcon,
  getWeightedPermissions,
} from '../../../helpers/utils/permission';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSnapsMetadata } from '../../../selectors';

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

export default function PermissionsConnectPermissionList({ permissions }) {
  const t = useI18nContext();
  const snapsMetadata = useSelector(getSnapsMetadata);

  const getSnapName = (id) => {
    return snapsMetadata[id]?.name ?? stripSnapPrefix(id);
  };

  return (
    <div className="permissions-connect-permission-list">
      {getWeightedPermissions({
        t,
        permissions,
        getSubjectName: getSnapName,
      }).map(getDescriptionNode)}
    </div>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.object.isRequired,
};
