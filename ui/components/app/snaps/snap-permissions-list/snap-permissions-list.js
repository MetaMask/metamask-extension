import React from 'react';
import PropTypes from 'prop-types';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import PermissionCell from '../../permission-cell';
import Box from '../../../ui/box';

export default function SnapPermissionsList({
  snapId,
  permissions,
  targetSubjectMetadata,
  showOptions,
}) {
  const t = useI18nContext();

  return (
    <Box paddingTop={2} paddingBottom={2} className="snap-permissions-list">
      {getWeightedPermissions(t, permissions, targetSubjectMetadata).map(
        (permission, index) => {
          return (
            <PermissionCell
              snapId={snapId}
              permissionName={permission.permissionName}
              title={permission.label}
              description={permission.description}
              weight={permission.weight}
              avatarIcon={permission.leftIcon}
              dateApproved={permission?.permissionValue?.date}
              key={`${permission.permissionName}-${index}`}
              showOptions={showOptions}
            />
          );
        },
      )}
    </Box>
  );
}

SnapPermissionsList.propTypes = {
  snapId: PropTypes.string.isRequired,
  permissions: PropTypes.object.isRequired,
  targetSubjectMetadata: PropTypes.object.isRequired,
  showOptions: PropTypes.bool,
};
