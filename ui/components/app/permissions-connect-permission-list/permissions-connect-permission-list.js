import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getWeightedPermissions } from '../../../helpers/utils/permission';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSnapsMetadata } from '../../../selectors';
import { getSnapName } from '../../../helpers/utils/util';
import PermissionCell from '../permission-cell';

/**
 * Get one or more permission descriptions for a permission name.
 *
 * @param permission - The permission to render.
 * @param index - The index of the permission.
 * @returns {JSX.Element} A permission description node.
 */
function getDescriptionNode(permission, index) {
  return (
    <PermissionCell
      permissionName={permission.name}
      title={permission.label}
      description={permission.description}
      weight={permission.weight}
      avatarIcon={permission.leftIcon}
      key={`${permission.permissionName}-${index}`}
    />
  );
}

export default function PermissionsConnectPermissionList({
  permissions,
  subjectName,
}) {
  const t = useI18nContext();
  const snapsMetadata = useSelector(getSnapsMetadata);

  return (
    <div className="permissions-connect-permission-list">
      {getWeightedPermissions({
        t,
        permissions,
        getSubjectName: getSnapName(snapsMetadata),
        subjectName,
      }).map(getDescriptionNode)}
    </div>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.object.isRequired,
  subjectName: PropTypes.string.isRequired,
};
