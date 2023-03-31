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
      {getWeightedPermissions(t, permissions).map((perm, index) => {
        return (
          <PermissionCell
            title={perm.label}
            description={perm.description}
            weight={perm.weight}
            avatarIcon={perm.leftIcon}
            dateApproved={perm?.permissionValue?.date}
            key={`${perm.permissionName}-${index}`}
          />
        );
      })}
    </Box>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.object.isRequired,
};
