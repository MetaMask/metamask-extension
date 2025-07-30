export const extractNetworkName = (
  networks,
  chainId,
  isFullNetworkName = false,
) => {
  const network = networks[chainId];
  if (network?.name && network?.name !== '') {
    return isFullNetworkName
      ? network.name
      : `networkName${network.name.split(' ')[0]}`;
  }
  return 'unknownNetworkForGatorPermissions';
};

export const handleRevokeClick = async ({
  gatorPermission,
  findDelegatorFromInternalAccounts,
  revokeGatorPermission,
}) => {
  const { permissionResponse } = gatorPermission;

  const internalAccount = findDelegatorFromInternalAccounts(
    permissionResponse.address,
  );
  if (!internalAccount) {
    throw new Error('Internal account not found');
  }

  await revokeGatorPermission({
    permissionContext: permissionResponse.context,
    delegationManagerAddress: permissionResponse.signerMeta.delegationManager,
    accountAddress: internalAccount.address,
  });
};

export const handleRevokeBatchClick = async ({
  gatorPermissions,
  findDelegatorFromInternalAccounts,
  revokeGatorPermissionBatch,
}) => {
  const revokeGatorPermissionArgs = gatorPermissions.map((gatorPermission) => {
    const { permissionResponse } = gatorPermission;

    const internalAccount = findDelegatorFromInternalAccounts(
      permissionResponse.address,
    );
    if (!internalAccount) {
      throw new Error('Internal account not found');
    }

    return {
      permissionContext: permissionResponse.context,
      delegationManagerAddress: permissionResponse.signerMeta.delegationManager,
      accountAddress: internalAccount.address,
    };
  });

  await revokeGatorPermissionBatch(revokeGatorPermissionArgs);
};
