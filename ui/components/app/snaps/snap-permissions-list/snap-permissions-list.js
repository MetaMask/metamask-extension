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
  const state = useSelector((value) => value);

  /**
   * Get the snap name from the snap ID.
   *
   * This is used to get the names for permissions which include snap IDs as
   * caveat.
   *
   * @param id - The snap ID.
   * @returns {string | undefined} The snap name if it exists, or `undefined`.
   */
  const getSnapName = (id) => {
    const snap = getSnapMetadata(state, id);
    return snap?.name;
  };

  return (
    <Box paddingTop={2} paddingBottom={2} className="snap-permissions-list">
      {getWeightedPermissions(
        t,
        permissions,
        targetSubjectMetadata,
        getSnapName,
      )
        .map()
        .map((permission, index) => {
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
  showOptions: PropTypes.bool,
  targetSubjectMetadata: PropTypes.object.isRequired,
};
