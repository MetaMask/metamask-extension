import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box } from '../../../component-library';
import {
  getMultipleTargetsSubjectMetadata,
  getSnapsMetadata,
} from '../../../../selectors';
import { getSnapName } from '../../../../helpers/utils/util';
import SnapPermissionCell from '../snap-permission-cell';

export default function SnapPermissionsList({
  snapId,
  snapName,
  permissions,
  connections,
  showOptions,
}) {
  const t = useI18nContext();
  const snapsMetadata = useSelector(getSnapsMetadata);
  const permissionsToShow = {
    ...permissions,
    connection_permission: connections ?? {},
  };
  const targetSubjectsMetadata = useSelector((state) =>
    getMultipleTargetsSubjectMetadata(state, connections),
  );

  return (
    <Box className="snap-permissions-list">
      {getWeightedPermissions({
        t,
        permissions: permissionsToShow,
        subjectName: snapName,
        getSubjectName: getSnapName(snapsMetadata),
      }).map((permission, index) => (
        <SnapPermissionCell
          snapId={snapId}
          showOptions={showOptions}
          connectionSubjectMetadata={
            targetSubjectsMetadata[permission.connection]
          }
          permission={permission}
          index={index}
          key={`permissionCellDisplay_${snapId}_${index}`}
        />
      ))}
    </Box>
  );
}

SnapPermissionsList.propTypes = {
  snapId: PropTypes.string.isRequired,
  snapName: PropTypes.string.isRequired,
  permissions: PropTypes.object.isRequired,
  connections: PropTypes.object,
  showOptions: PropTypes.bool,
};
