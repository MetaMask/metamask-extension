import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import PermissionCell from '../../permission-cell';
import { Box } from '../../../component-library';
import { getSnapMetadata, getSnapsMetadata } from '../../../../selectors';
import { getSnapName } from '../../../../helpers/utils/util';

export default function UpdateSnapPermissionList({
  approvedPermissions,
  revokedPermissions,
  newPermissions,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, targetSubjectMetadata.origin),
  );

  const snapsMetadata = useSelector(getSnapsMetadata);
  const snapsNameGetter = getSnapName(snapsMetadata);

  return (
    <Box paddingTop={1}>
      {getWeightedPermissions({
        t,
        permissions: newPermissions,
        subjectName: snapName,
        getSubjectName: snapsNameGetter,
      }).map((permission, index) => (
        <PermissionCell
          permissionName={permission.permissionName}
          title={permission.label}
          description={permission.description}
          weight={permission.weight}
          avatarIcon={permission.leftIcon}
          dateApproved={permission?.permissionValue?.date}
          key={`${permission.permissionName}-${index}`}
        />
      ))}
      {getWeightedPermissions({
        t,
        permissions: revokedPermissions,
        subjectName: snapName,
        getSubjectName: snapsNameGetter,
      }).map((permission, index) => (
        <PermissionCell
          permissionName={permission.permissionName}
          title={permission.label}
          description={permission.description}
          weight={permission.weight}
          avatarIcon={permission.leftIcon}
          dateApproved={permission?.permissionValue?.date}
          key={`${permission.permissionName}-${index}`}
          revoked
        />
      ))}
      {getWeightedPermissions({
        t,
        permissions: approvedPermissions,
        subjectName: snapName,
        getSubjectName: snapsNameGetter,
      }).map((permission, index) => (
        <PermissionCell
          permissionName={permission.permissionName}
          title={permission.label}
          description={permission.description}
          weight={permission.weight}
          avatarIcon={permission.leftIcon}
          dateApproved={permission?.permissionValue?.date}
          key={`${permission.permissionName}-${index}`}
        />
      ))}
    </Box>
  );
}

UpdateSnapPermissionList.propTypes = {
  /**
   * Permissions that have already been approved
   */
  approvedPermissions: PropTypes.object.isRequired,
  /**
   * Previously used permissions that are now revoked
   */
  revokedPermissions: PropTypes.object.isRequired,
  /**
   * New permissions that are being requested
   */
  newPermissions: PropTypes.object.isRequired,
  targetSubjectMetadata: PropTypes.object.isRequired,
};
