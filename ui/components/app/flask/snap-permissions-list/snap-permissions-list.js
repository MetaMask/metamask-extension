import React from 'react';
import PropTypes from 'prop-types';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import PermissionCell from '../../permission-cell';
import Box from '../../../ui/box';

export default function SnapPermissionsList({
  permissions,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

  return (
    <Box paddingTop={2} paddingBottom={2}>
      {getWeightedPermissions(t, permissions, targetSubjectMetadata).map(
        (permission, index) => {
          return (
            <PermissionCell
              title={permission.label}
              description={permission.description}
              weight={permission.weight}
              avatarIcon={permission.leftIcon}
              dateApproved={permission?.permissionValue?.date}
              key={`${permission.permissionName}-${index}`}
            />
          );
        },
      )}
    </Box>
  );
}

SnapPermissionsList.propTypes = {
  permissions: PropTypes.object.isRequired,
  targetSubjectMetadata: PropTypes.object.isRequired,
};
