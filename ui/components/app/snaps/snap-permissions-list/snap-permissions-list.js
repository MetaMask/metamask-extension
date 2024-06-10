import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box, ButtonLink } from '../../../component-library';
import {
  getMultipleTargetsSubjectMetadata,
  getSnapsMetadata,
} from '../../../../selectors';
import {
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import {
  PermissionsAbstractionThreshold,
  PermissionWeightThreshold,
} from '../../../../../shared/constants/permissions';
import {
  getFilteredSnapPermissions,
  getSnapName,
} from '../../../../helpers/utils/util';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';
import SnapPermissionAdapter from '../snap-permission-adapter';

export default function SnapPermissionsList({
  snapId,
  snapName,
  permissions,
  connections,
  showOptions,
  showAllPermissions,
  onShowAllPermissions,
}) {
  const t = useI18nContext();

  const combinedPermissions = useMemo(() => {
    return { ...permissions, connection_permission: connections ?? {} };
  }, [permissions, connections]);

  const targetSubjectsMetadata = useSelector((state) =>
    getMultipleTargetsSubjectMetadata(state, connections),
  );

  const snapsMetadata = useSelector(getSnapsMetadata);

  const weightedPermissions = getWeightedPermissions({
    t,
    permissions: combinedPermissions,
    subjectName: snapName,
    getSubjectName: getSnapName(snapsMetadata),
  });

  const [showAll, setShowAll] = useState(
    showAllPermissions ||
      Object.keys(weightedPermissions).length <=
        PermissionsAbstractionThreshold,
  );

  const filteredPermissions = getFilteredSnapPermissions(
    weightedPermissions,
    PermissionWeightThreshold.snapInstall,
    true,
  );

  const onShowAllPermissionsHandler = () => {
    onShowAllPermissions();
    setShowAll(true);
  };

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      <Box className="snap-permissions-list">
        <SnapPermissionAdapter
          permissions={showAll ? weightedPermissions : filteredPermissions}
          snapId={snapId}
          snapName={snapName}
          showOptions={showOptions}
          targetSubjectsMetadata={targetSubjectsMetadata}
        />
      </Box>
      {showAll ? null : (
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          paddingTop={2}
          paddingBottom={2}
        >
          <ButtonLink onClick={() => onShowAllPermissionsHandler()}>
            {t('seeAllPermissions')}
          </ButtonLink>
        </Box>
      )}
    </Box>
  );
}

SnapPermissionsList.propTypes = {
  snapId: PropTypes.string.isRequired,
  snapName: PropTypes.string.isRequired,
  permissions: PropTypes.object.isRequired,
  connections: PropTypes.object,
  showOptions: PropTypes.bool,
  showAllPermissions: PropTypes.bool,
  onShowAllPermissions: PropTypes.func,
};
