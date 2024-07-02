import React, { useState, useEffect, useMemo } from 'react';
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
import SnapPermissionAdapter from '../snap-permission-adapter';
import {
  PermissionsAbstractionThreshold,
  PermissionWeightThreshold,
} from '../../../../../shared/constants/permissions';
import { getSnapName } from '../../../../helpers/utils/util';
import { getWeightedPermissions } from '../../../../helpers/utils/permission';

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

  const [showAll, setShowAll] = useState(false);

  const [permissionsToDisplay, setPermissionsToDisplay] = useState([]);

  const [weightedPermissions, setWeightedPermissions] = useState({});

  useEffect(() => {
    let finalPermissions = weightedPermissions;
    if (Object.keys(finalPermissions).length === 0) {
      finalPermissions = getWeightedPermissions({
        t,
        permissions: combinedPermissions,
        subjectName: snapName,
        getSubjectName: getSnapName(snapsMetadata),
      });
      setWeightedPermissions(finalPermissions);
    }

    // Handle abstraction of permissions
    if (showAllPermissions && !showAll) {
      setShowAll(true);
    }

    if (
      Object.keys(finalPermissions).length <= PermissionsAbstractionThreshold &&
      !showAll
    ) {
      setShowAll(true);
    }

    // Handle what to display based on the permission abstraction criteria
    if (showAll) {
      setPermissionsToDisplay(
        <SnapPermissionAdapter
          permissions={finalPermissions}
          snapId={snapId}
          snapName={snapName}
          targetSubjectsMetadata={targetSubjectsMetadata}
          showOptions={showOptions}
        />,
      );
    } else {
      setPermissionsToDisplay(
        <SnapPermissionAdapter
          permissions={finalPermissions}
          snapId={snapId}
          snapName={snapName}
          targetSubjectsMetadata={targetSubjectsMetadata}
          showOptions={showOptions}
          weightThreshold={PermissionWeightThreshold.snapInstall}
        />,
      );
    }
  }, [
    showAll,
    setPermissionsToDisplay,
    weightedPermissions,
    setWeightedPermissions,
    snapId,
    snapName,
    targetSubjectsMetadata,
    showOptions,
    combinedPermissions,
    t,
    snapsMetadata,
    permissions,
    connections,
    showAllPermissions,
  ]);

  const onShowAllPermissionsHandler = () => {
    onShowAllPermissions();
    setShowAll(true);
  };

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      <Box className="snap-permissions-list">{permissionsToDisplay}</Box>
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
