import React from 'react';
import PropTypes from 'prop-types';
import { getPermissionDescription } from '../../../../helpers/utils/permission';
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

  const ApprovedPermissions = () => {
    return Object.entries(approvedPermissions).map(
      ([permissionName, permissionValue]) => {
        const permissions = getPermissionDescription(
          t,
          permissionName,
          permissionValue,
        );
        const { date } = permissionValue;
        const formattedDate = formatDate(date, 'yyyy-MM-dd');
        return permissions.map(({ label, rightIcon }) => (
          <div className="approved-permission" key={permissionName}>
            <i className="fas fa-check" />
            <div className="permission-description">
              {label}
              <Typography
                color={TextColor.textAlternative}
                className="permission-description-subtext"
                boxProps={{ paddingTop: 1 }}
              >
                {t('approvedOn', [formattedDate])}
              </Typography>
            </div>
            {rightIcon && <i className={rightIcon} />}
          </div>
        ));
      },
    );
  };

  const RevokedPermissions = () => {
    return Object.entries(revokedPermissions).map(
      ([permissionName, permissionValue]) => {
        const permissions = getPermissionDescription(
          t,
          permissionName,
          permissionValue,
        );
        return permissions.map(({ label, rightIcon }) => (
          <div className="revoked-permission" key={permissionName}>
            <i className="fas fa-x" />
            <div className="permission-description">
              {label}
              <Typography
                color={TextColor.textAlternative}
                boxProps={{ paddingTop: 1 }}
                className="permission-description-subtext"
              >
                {t('permissionRevoked')}
              </Typography>
            </div>
            {rightIcon && <i className={rightIcon} />}
          </div>
        ));
      },
    );
  };

  const NewPermissions = () => {
    return Object.entries(newPermissions).map(
      ([permissionName, permissionValue]) => {
        const permissions = getPermissionDescription(
          t,
          permissionName,
          permissionValue,
        );
        return permissions.map(({ label, rightIcon }) => (
          <div className="new-permission" key={permissionName}>
            <i className="fas fa-arrow-right" />
            <div className="permission-description">
              {label}
              <Typography
                color={TextColor.textAlternative}
                boxProps={{ paddingTop: 1 }}
                className="permission-description-subtext"
              >
                {t('permissionRequested')}
              </Typography>
            </div>
            {rightIcon && <i className={rightIcon} />}
          </div>
        ));
      },
    );
  };

  return (
    <div className="update-snap-permission-list">
      <NewPermissions />
      <ApprovedPermissions />
      <RevokedPermissions />
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
