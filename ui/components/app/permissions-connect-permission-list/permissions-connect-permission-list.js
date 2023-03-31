import React from 'react';
import PropTypes from 'prop-types';
import { getWeightedPermissions } from '../../../helpers/utils/permission';
import { useI18nContext } from '../../../hooks/useI18nContext';
import PermissionCell from '../permission-cell';
import Box from '../../ui/box';

export default function PermissionsConnectPermissionList({ permissions }) {
  const t = useI18nContext();

  return (
    <Box paddingTop={1}>
      {getWeightedPermissions(t, permissions).map((permission, index) => {
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
      })}
    </Box>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.object.isRequired,
};
