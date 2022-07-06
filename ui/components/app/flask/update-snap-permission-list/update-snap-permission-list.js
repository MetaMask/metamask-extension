import React from 'react';
import PropTypes from 'prop-types';
import { getPermissionDescription } from '../../../../helpers/utils/permission';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export default function UpdateSnapPermissionList({
  approvedPermissions,
  revokedPermissions,
  newPermissions,
}) {
  const t = useI18nContext();

  const ApprovedPermissions = () => {
    return Object.keys(approvedPermissions).map((approvedPermission) => {
      const { label, rightIcon } = getPermissionDescription(
        t,
        approvedPermission,
      );
      const { date } = approvedPermissions[approvedPermission];
      const dateObj = new Date(date);
      const [month, day, year] = [
        dateObj.getMonth(),
        date.getDate(),
        date.getFullYear(),
      ];
      const formattedDate = `${year}-${month}-${day}`;

      return (
        <div className="approved-permission-container" key={approvedPermission}>
          <div className="approved-permission">
            <i className="fas fa-check" />
            {label}
            {rightIcon && <i className={rightIcon} />}
          </div>
          <div className="approved-permission-subtext">
            {t('approvedOn', [formattedDate])}
          </div>
        </div>
      );
    });
  };

  const RevokedPermissions = () => {
    return Object.keys(revokedPermissions).map((revokedPermission) => {
      const { label, rightIcon } = getPermissionDescription(
        t,
        revokedPermission,
      );
      return (
        <div className="revoked-permission-container" key={revokedPermission}>
          <div className="revoked-permission">
            <i className="fas fa-x" />
            {label}
            {rightIcon && <i className={rightIcon} />}
          </div>
          <div className="revoked-permission-subtext">
            {t('permissionRevoked')}
          </div>
        </div>
      );
    });
  };

  const NewPermissions = () => {
    return Object.keys(newPermissions).map((newPermission) => {
      const { label, rightIcon } = getPermissionDescription(t, newPermission);
      return (
        <div className="new-permission" key={newPermission}>
          <i className="fas fa-arrow-right" />
          {label}
          {rightIcon && <i className={rightIcon} />}
        </div>
      );
    });
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
  approvedPermissions: PropTypes.object.isRequired,
  revokedPermissions: PropTypes.object.isRequired,
  newPermissions: PropTypes.object.isRequired,
};
