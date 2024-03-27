import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import PermissionCell from '../../permission-cell';
import { Box } from '../../../component-library';
import { getSnapsMetadata } from '../../../../selectors';
import { getSnapName } from '../../../../helpers/utils/util';

export default function SnapPermissionsList({
  snapId,
  snapName,
  permissions,
  showOptions,
}) {
  const t = useI18nContext();
  const snapsMetadata = useSelector(getSnapsMetadata);

  return (
    <Box paddingTop={2} paddingBottom={2} className="snap-permissions-list">
      {getWeightedPermissions({
        t,
        permissions,
        subjectName: snapName,
        getSubjectName: getSnapName(snapsMetadata),
      }).map((permission, index) => {
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
      })}
    </Box>
  );
}

SnapPermissionsList.propTypes = {
  snapId: PropTypes.string.isRequired,
  snapName: PropTypes.string.isRequired,
  permissions: PropTypes.object.isRequired,
  showOptions: PropTypes.bool,
};
