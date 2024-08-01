export const CaveatTypes = Object.freeze({
  restrictReturnedAccounts: 'restrictReturnedAccounts' as const,
  restrictNetworkSwitching: 'restrictNetworkSwitching' as const,
});

export const RestrictedEthMethods = Object.freeze({
  eth_accounts: 'eth_accounts',
});

export const RestrictedMethods = Object.freeze({
  eth_accounts: 'eth_accounts',
  snap_dialog: 'snap_dialog',
  snap_notify: 'snap_notify',
  snap_manageState: 'snap_manageState',
  snap_getBip32PublicKey: 'snap_getBip32PublicKey',
  snap_getBip32Entropy: 'snap_getBip32Entropy',
  snap_getBip44Entropy: 'snap_getBip44Entropy',
  snap_getEntropy: 'snap_getEntropy',
  snap_getLocale: 'snap_getLocale',
  wallet_snap: 'wallet_snap',
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  snap_manageAccounts: 'snap_manageAccounts',
  ///: END:ONLY_INCLUDE_IF
} as const);

// ConnectionPermission is pseudo permission used to make possible
// displaying pre-approved connections in the UI seamlessly, alongside other permissions.
export const ConnectionPermission = Object.freeze({
  connection_permission: 'connection_permission',
});

export * from './snaps/permissions';
