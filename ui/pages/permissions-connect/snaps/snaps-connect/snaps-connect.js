import React from 'react';
import PropTypes from 'prop-types';
import { isObject } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  SnapCaveatType,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/rpc-methods';
import Box from '../../../../components/ui/box';
import { getPermissions } from '../../../../selectors';

export default function SnapsConnect({
  request,
  approveConnection,
  rejectConnection,
  targetSubjectMetadata,
}) {
  const currentPermissions = useSelector((state) =>
    getPermissions(state, request.metadata.origin),
  );

  const onCancel = () => {
    rejectConnection(request.metadata.id);
  };

  const onConnect = () => {
    approveConnection(request);
  };

  const getDedupedSnapPermissions = () => {
    const permission = request.permissions[WALLET_SNAP_PERMISSION_KEY];
    const requestedSnaps = permission?.caveats[0].value;

    const currentSnaps =
      currentPermissions[WALLET_SNAP_PERMISSION_KEY]?.caveats[0].value;

    if (!isObject(currentSnaps)) {
      return permission;
    }

    const requestedSnapKeys = requestedSnaps ? Object.keys(requestedSnaps) : [];
    const currentSnapKeys = currentSnaps ? Object.keys(currentSnaps) : [];
    const dedupedCaveats = requestedSnapKeys.reduce((acc, snapId) => {
      if (!currentSnapKeys.includes(snapId)) {
        acc[snapId] = {};
      }
      return acc;
    }, {});

    return {
      ...permission,
      caveats: [{ type: SnapCaveatType.SnapIds, value: dedupedCaveats }],
    };
  };

  return <Box className="page-container snap-connect">foobar</Box>;
}

SnapsConnect.propTypes = {
  request: PropTypes.object.isRequired,
  approveConnection: PropTypes.func.isRequired,
  rejectConnection: PropTypes.func.isRequired,
  targetSubjectMetadata: PropTypes.shape({
    extensionId: PropTypes.string,
    iconUrl: PropTypes.string,
    name: PropTypes.string,
    origin: PropTypes.string,
    subjectType: PropTypes.string,
  }),
};
