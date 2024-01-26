import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import PermissionCell from '../../permission-cell';
import { Box } from '../../../component-library';
import { getSnapMetadata } from '../../../../selectors';

export default function UpdateSnapPermissionList({
  approvedPermissions,
  revokedPermissions,
  newPermissions,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();
  const snapId = targetSubjectMetadata?.origin;
  const snapName = useSelector((state) => getSnapMetadata(state, snapId))?.name;

  return (
    <Box paddingTop={1}>
      {getWeightedPermissions(t, newPermissions, snapName).map(
        (permission, index) => (
          <PermissionCell
            permissionName={permission.permissionName}
            title={permission.label}
            description={permission.description}
            weight={permission.weight}
            avatarIcon={permission.leftIcon}
            dateApproved={permission?.permissionValue?.date}
            key={`${permission.permissionName}-${index}`}
          />
        ),
      )}
      {getWeightedPermissions(t, revokedPermissions, snapName).map(
        (permission, index) => (
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
        ),
      )}
      {getWeightedPermissions(t, approvedPermissions, snapName).map(
        (permission, index) => (
          <PermissionCell
            permissionName={permission.permissionName}
            title={permission.label}
            description={permission.description}
            weight={permission.weight}
            avatarIcon={permission.leftIcon}
            dateApproved={permission?.permissionValue?.date}
            key={`${permission.permissionName}-${index}`}
          />
        ),
      )}
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
