import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import PermissionCell from '../../permission-cell';
import Box from '../../../ui/box';
import { getSnapMetadata } from '../../../../selectors';

export default function SnapPermissionsList({
  snapId,
  snapName,
  permissions,
  targetSubjectMetadata,
  showOptions,
}) {
  const t = useI18nContext();
  const snapName = useSelector((state) => getSnapMetadata(state, snapId))?.name;

  return (
    <Box paddingTop={2} paddingBottom={2} className="snap-permissions-list">
      {getWeightedPermissions(
        t,
        permissions,
        snapName,
      ).map((permission, index) => {
        return (
          <PermissionCell
            snapId={snapId}
            snapName={snapName}
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
      })}
    </Box>
  );
}

SnapPermissionsList.propTypes = {
  snapId: PropTypes.string.isRequired,
  snapName: PropTypes.string.isRequired,
  permissions: PropTypes.object.isRequired,
  targetSubjectMetadata: PropTypes.object.isRequired,
  showOptions: PropTypes.bool,
};
