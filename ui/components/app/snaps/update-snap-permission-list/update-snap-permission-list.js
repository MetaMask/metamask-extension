import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box, ButtonLink } from '../../../component-library';
import {
  getMultipleTargetsSubjectMetadata,
  getSnapMetadata,
  getSnapsMetadata,
} from '../../../../selectors';
import SnapPermissionAdapter from '../snap-permission-adapter';
import {
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import {
  MinPermissionAbstractionDisplayCount,
  PermissionWeightThreshold,
} from '../../../../../shared/constants/permissions';
import {
  getFilteredSnapPermissions,
  getSnapName,
} from '../../../../helpers/utils/util';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';

export default function UpdateSnapPermissionList({
  approvedPermissions,
  revokedPermissions,
  newPermissions,
  approvedConnections,
  revokedConnections,
  newConnections,
  targetSubjectMetadata,
  showAllPermissions,
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

  const approvedCombinedPermissions = {
    ...approvedPermissions,
    connection_permission: approvedConnections ?? {},
  };

  const revokedCombinedPermissions = {
    ...revokedPermissions,
    connection_permission: revokedConnections ?? {},
  };

  const newCombinedPermissions = {
    ...newPermissions,
    connection_permission: newConnections ?? {},
  };

  const newWeightedPermissions = getWeightedPermissions({
    t,
    permissions: newCombinedPermissions,
    subjectName: snapName,
    getSubjectName: getSnapName(snapsMetadata),
  });

  const revokedWeightedPermissions = getWeightedPermissions({
    t,
    permissions: revokedCombinedPermissions,
    subjectName: snapName,
    getSubjectName: getSnapName(snapsMetadata),
  });

  const approvedWeightedPermissions = getWeightedPermissions({
    t,
    permissions: approvedCombinedPermissions,
    subjectName: snapName,
    getSubjectName: getSnapName(snapsMetadata),
  });

  const [showAll, setShowAll] = useState(
    Object.keys(approvedWeightedPermissions).length < 1,
  );

  // Because approved permissions are sometimes hidden following the abstraction logic,
  // it is needed sometimes to fill the gap in permission display, in certain edge cases
  // when there is not enough new and revoked permissions to be shown.
  const totalNewAndRevokedPermissions =
    newWeightedPermissions.length + revokedWeightedPermissions.length;
  const minApprovedPermissionsToShow = Math.max(
    MinPermissionAbstractionDisplayCount - totalNewAndRevokedPermissions,
    0,
  );

  const filteredApprovedWeightedPermissions = getFilteredSnapPermissions(
    approvedWeightedPermissions,
    PermissionWeightThreshold.snapUpdateApprovedPermissions,
    minApprovedPermissionsToShow,
  );

  const onShowAllPermissions = () => {
    showAllPermissions();
    setShowAll(true);
  };

  return (
    <Box>
      <SnapPermissionAdapter
        permissions={newWeightedPermissions}
        snapId={snapId}
        snapName={snapName}
        targetSubjectsMetadata={targetSubjectsMetadata}
      />
      <SnapPermissionAdapter
        permissions={revokedWeightedPermissions}
        snapId={snapId}
        snapName={snapName}
        targetSubjectsMetadata={targetSubjectsMetadata}
        revoked
      />
      <SnapPermissionAdapter
        permissions={
          showAll
            ? approvedWeightedPermissions
            : filteredApprovedWeightedPermissions
        }
        snapId={snapId}
        snapName={snapName}
        targetSubjectsMetadata={targetSubjectsMetadata}
        approved
      />
      {showAll ? null : (
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          paddingTop={2}
          paddingBottom={2}
        >
          <ButtonLink onClick={() => onShowAllPermissions()}>
            {t('seeAllPermissions')}
          </ButtonLink>
        </Box>
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
  /**
   * Callback function used to handle revealing all permissions action in UI.
   */
  showAllPermissions: PropTypes.func.isRequired,
  targetSubjectMetadata: PropTypes.object.isRequired,
};
