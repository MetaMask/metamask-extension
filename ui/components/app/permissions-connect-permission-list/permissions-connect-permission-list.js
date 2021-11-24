import { type } from 'eth-simple-keyring';
import { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { I18nContext } from '../../../contexts/i18n';
import { getPermissionsRequests } from '../../../selectors';

const PERMISSION_TYPES = {
  eth_accounts: {
    leftIcon: 'fas fa-eye',
    label: '',
    rightIcon: null,
  },
};

function Permission({ leftIcon, label, rightIcon = null }) {
  const t = useContext(I18nContext);
  return (
    <div className="permission">
      <i className={leftIcon} />
      {t(label)}
      {rightIcon ? <i classname={rightIcon} /> : null}
    </div>
  );
}

export default function PermissionsConnectPermissionList({
  permissionRequestId,
}) {
  const permissionRequests = useSelector(getPermissionsRequests);
  const permissionRequest = useMemo(
    () =>
      permissionRequests.find((req) => req.metadata.id === permissionRequestId),
    [permissionRequestId, permissionRequests],
  );

  const permissions = useMemo(() => {
    permissions = [];
    for (const permission in permissionRequest.permissions) {
      type = PERMISSION_TYPES[permission];
      permissions.append(
        <Permission
          leftIcon={type.leftIcon}
          label={type.label}
          rightIcon={type.rightIcon}
        />,
      );
    }
    return permisssions;
  }, [permissionRequest]);

  return <div class="permissions-connect-permission-list">{permissions}</div>;
}
