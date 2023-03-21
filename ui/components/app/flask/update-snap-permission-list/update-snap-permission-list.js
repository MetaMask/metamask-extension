import React from 'react';
import PropTypes from 'prop-types';
import { isFunction } from 'lodash';
import {
  getRightIcon,
  getWeightedPermissions,
} from '../../../../helpers/utils/permission';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { formatDate } from '../../../../helpers/utils/util';
import Typography from '../../../ui/typography/typography';
import { TextColor } from '../../../../helpers/constants/design-system';

export default function UpdateSnapPermissionList({
  approvedPermissions,
  revokedPermissions,
  newPermissions,
}) {
  const t = useI18nContext();

  const Permissions = ({ className, permissions, subText }) => {
    return getWeightedPermissions(t, permissions).map((permission) => {
      const { label, permissionName, permissionValue } = permission;
      return (
        <div className={className} key={permissionName}>
          <i className="fas fa-x" />
          <div className="permission-description">
            {label}
            <Typography
              color={TextColor.textAlternative}
              boxProps={{ paddingTop: 1 }}
              className="permission-description-subtext"
            >
              {isFunction(subText)
                ? subText(permissionName, permissionValue)
                : subText}
            </Typography>
          </div>
          {getRightIcon(permission)}
        </div>
      );
    });
  };

  return (
    <div className="update-snap-permission-list">
      <Permissions
        className="new-permission"
        permissions={newPermissions}
        subText={t('permissionRequested')}
      />
      <Permissions
        className="approved-permission"
        permissions={approvedPermissions}
        subText={(_, permissionValue) => {
          const { date } = permissionValue;
          const formattedDate = formatDate(date, 'yyyy-MM-dd');
          return t('approvedOn', [formattedDate]);
        }}
      />
      <Permissions
        className="revoked-permission"
        permissions={revokedPermissions}
        subText={t('permissionRevoked')}
      />
    </div>
  );
}

UpdateSnapPermissionList.propTypes = {
  /**
   * Permissions that have already been approved
   */
  approvedPermissions: PropTypes.object.isRequired,
  /**
   * Previously used permissions that are now revoked
   */
  revokedPermissions: PropTypes.object.isRequired,
  /**
   * New permissions that are being requested
   */
  newPermissions: PropTypes.object.isRequired,
};
