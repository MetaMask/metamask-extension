import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';

import { getWeightedPermissions } from '../../../helpers/utils/permission';
import { getSnapName } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSnapsMetadata } from '../../../selectors';
import { Box } from '../../component-library';
import PermissionCell from '../permission-cell';

/**
 * Get one or more permission descriptions for a permission name.
 *
 * @param options - The options object.
 * @param options.permission - The permission to render.
 * @param options.index - The index of the permission.
 * @param options.accounts - An array representing list of accounts for which permission is used.
 * @param options.requestedChainIds - An array representing list of chain ids for which permission is used.
 * @returns {JSX.Element} A permission description node.
 */
function getDescriptionNode({
  permission,
  index,
  accounts,
  requestedChainIds,
}) {
  return (
    <PermissionCell
      permissionName={permission.name}
      title={permission.label}
      description={permission.description}
      weight={permission.weight}
      avatarIcon={permission.leftIcon}
      key={`${permission.permissionName}-${index}`}
      accounts={accounts}
      chainIds={requestedChainIds}
    />
  );
}

export default function PermissionsConnectPermissionList({
  isRequestApprovalPermittedChains,
  permissions,
  subjectName,
  accounts,
  requestedChainIds,
}) {
  const t = useI18nContext();
  const snapsMetadata = useSelector(getSnapsMetadata);

  return (
    <Box as="span">
      {getWeightedPermissions({
        t,
        isRequestApprovalPermittedChains,
        permissions,
        getSubjectName: getSnapName(snapsMetadata),
        subjectName,
      }).map((permission, index) => {
        return getDescriptionNode({
          permission,
          index,
          accounts,
          requestedChainIds,
        });
      })}
    </Box>
  );
}

PermissionsConnectPermissionList.propTypes = {
  permissions: PropTypes.object.isRequired,
  subjectName: PropTypes.string.isRequired,
  requestedChainIds: PropTypes.array,
  accounts: PropTypes.arrayOf(PropTypes.object),
  isRequestApprovalPermittedChains: PropTypes.boolean,
};
