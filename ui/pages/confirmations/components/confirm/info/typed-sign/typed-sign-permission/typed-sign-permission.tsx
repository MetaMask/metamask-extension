import React from 'react';

import { SignatureRequestType } from '../../../../../types/confirm';
import { useConfirmContext } from '../../../../../context/confirm';

import { PermissionDetailRenderer } from './permission-detail-renderer';

/**
 * Main component for displaying typed signature permission information.
 * Renders different permission details based on the permission type (native token periodic/stream, ERC20 token periodic/stream).
 * Common sections (justification, origin, recipient, network) are declared in the shared permission schema.
 *
 * @returns JSX element containing the permission information UI
 */
const TypedSignPermissionInfo: React.FC = () => {
  const {
    currentConfirmation: { decodedPermission, id },
  } = useConfirmContext<SignatureRequestType>();

  if (!decodedPermission) {
    throw new Error('Decoded permission is undefined');
  }

  const { expiry, chainId } = decodedPermission;

  return (
    <PermissionDetailRenderer
      permission={decodedPermission.permission}
      expiry={expiry}
      chainId={chainId}
      origin={decodedPermission.origin}
      to={decodedPermission.to}
      ownerId={id}
    />
  );
};

export default TypedSignPermissionInfo;
