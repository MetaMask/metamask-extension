import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getWeightedPermissions } from '../../../helpers/utils/permission';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSnapsMetadata } from '../../../selectors';
import { getSnapName } from '../../../helpers/utils/util';
import PermissionCell from '../permission-cell';
import { Box } from '../../component-library';

/**
 * Get one or more permission descriptions for a permission name.
 *
 * @param options - The options object.
 * @param options.permission - The permission to render.
 * @param options.index - The index of the permission.
 * @param options.accounts - An array representing list of accounts for which permission is used.
 * @param options.requestedChainIds - An array representing list of EVM chain ids for which permission is used.
 * @param options.caipChainIds - An array of CAIP chain IDs for multichain display (e.g., 'solana:...').
 * @returns {JSX.Element} A permission description node.
 */
function getDescriptionNode({
  permission,
  index,
  accounts,
  requestedChainIds,
  caipChainIds,
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
      caipChainIds={caipChainIds}
    />
  );
}

export default function PermissionsConnectPermissionList({
  isRequestApprovalPermittedChains,
  permissions,
  subjectName,
  accounts,
  requestedChainIds,
  caipChainIds,
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
          caipChainIds,
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
  /** CAIP chain IDs for multichain display (e.g., 'solana:...') */
  caipChainIds: PropTypes.array,
};
