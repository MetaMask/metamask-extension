import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box } from '../../../component-library';
import {
  getMultipleTargetsSubjectMetadata,
  getSnapMetadata,
  getSnapsMetadata,
} from '../../../../selectors';
import { getSnapName } from '../../../../helpers/utils/util';
import SnapPermissionCell from '../snap-permission-cell';

export default function UpdateSnapPermissionList({
  approvedPermissions,
  revokedPermissions,
  newPermissions,
  approvedConnections,
  revokedConnections,
  newConnections,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();
  const snapId = targetSubjectMetadata.origin;

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, targetSubjectMetadata.origin),
  );

  const targetSubjectsMetadata = useSelector((state) =>
    getMultipleTargetsSubjectMetadata(state, {
      ...newConnections,
      ...approvedConnections,
      ...revokedConnections,
    }),
  );

  const snapsMetadata = useSelector(getSnapsMetadata);
  const snapsNameGetter = getSnapName(snapsMetadata);

  const approvedPermissionsToShow = {
    ...approvedPermissions,
    connection_permission: approvedConnections ?? {},
  };

  const revokedPermissionsToShow = {
    ...revokedPermissions,
    connection_permission: revokedConnections ?? {},
  };

  const newPermissionsToShow = {
    ...newPermissions,
    connection_permission: newConnections ?? {},
  };

  return (
    <Box>
      {getWeightedPermissions({
        t,
        permissions: newPermissionsToShow,
        subjectName: snapName,
        getSubjectName: snapsNameGetter,
      }).map((permission, index) => (
        <SnapPermissionCell
          snapId={snapId}
          connectionSubjectMetadata={
            targetSubjectsMetadata[permission.connection]
          }
          permission={permission}
          index={index}
          key={`permissionCellDisplay_${snapId}_${index}`}
        />
      ))}
      {getWeightedPermissions({
        t,
        permissions: revokedPermissionsToShow,
        subjectName: snapName,
        getSubjectName: snapsNameGetter,
      }).map((permission, index) => (
        <SnapPermissionCell
          snapId={snapId}
          connectionSubjectMetadata={
            targetSubjectsMetadata[permission.connection]
          }
          permission={permission}
          index={index}
          key={`permissionCellDisplay_${snapId}_${index}`}
          revoked
        />
      ))}
      {getWeightedPermissions({
        t,
        permissions: approvedPermissionsToShow,
        subjectName: snapName,
        getSubjectName: snapsNameGetter,
      }).map((permission, index) => (
        <SnapPermissionCell
          snapId={snapId}
          connectionSubjectMetadata={
            targetSubjectsMetadata[permission.connection]
          }
          permission={permission}
          index={index}
          key={`permissionCellDisplay_${snapId}_${index}`}
          approved
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
  /**
   * Pre-approved connections that have already been approved
   */
  approvedConnections: PropTypes.object.isRequired,
  /**
   * Previously used pre-approved connections that are now revoked
   */
  revokedConnections: PropTypes.object.isRequired,
  /**
   * New pre-approved connections that are being requested
   */
  newConnections: PropTypes.object.isRequired,
  targetSubjectMetadata: PropTypes.object.isRequired,
};
