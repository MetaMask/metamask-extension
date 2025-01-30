import React from 'react';
import PropTypes from 'prop-types';
import SnapPermissionCell from '../snap-permission-cell';

export default function SnapPermissionAdapter({
  snapId,
  permissions,
  showOptions,
  targetSubjectsMetadata,
  revoked,
  approved,
}) {
  return permissions.map((permission, index) => (
    <SnapPermissionCell
      snapId={snapId}
      showOptions={showOptions}
      connectionSubjectMetadata={targetSubjectsMetadata[permission.connection]}
      permission={permission}
      index={index}
      key={`permissionCellDisplay_${snapId}_${index}`}
      revoked={revoked}
      approved={approved}
    />
  ));
}

SnapPermissionAdapter.propTypes = {
  snapId: PropTypes.string.isRequired,
  snapName: PropTypes.string.isRequired,
  permissions: PropTypes.array.isRequired,
  showOptions: PropTypes.bool,
  targetSubjectsMetadata: PropTypes.object,
  weightThreshold: PropTypes.number,
  revoked: PropTypes.bool,
  approved: PropTypes.bool,
};
