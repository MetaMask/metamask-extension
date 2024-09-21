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
  snap_getPreferences: 'snap_getPreferences',
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

// This configuration specifies permission weight thresholds used to determine which
// permissions to show or hide on certain Snap-related flows (Install, Update, etc.)
export const PermissionWeightThreshold = Object.freeze({
  snapInstall: 3 as const,
  snapUpdateApprovedPermissions: 3 as const,
});

// Specify minimum number of permissions to be shown, when abstraction is applied
export const MinPermissionAbstractionDisplayCount = 3;

// Specify number of permissions used as threshold for permission abstraction logic to be applied
export const PermissionsAbstractionThreshold = 3;

export const PermissionWeight = Object.freeze({
  eth_accounts: 3,
  permittedChains: 3,
  snap_dialog: 4,
  snap_notify: 4,
  snap_getBip32PublicKey: 3,
  snap_getBip32Entropy: 1,
  snap_getBip44Entropy: 1,
  snap_getEntropy: 3,
  snap_manageState: 4,
  snap_getLocale: 4,
  wallet_snap: 4,
  endowment_networkAccess: 3,
  endowment_webassembly: 4,
  endowment_transactionInsight: 4,
  endowment_cronjob: 4,
  endowment_ethereumProvider: 4,
  endowment_rpc: 4,
  endowment_lifecycleHooks: 4,
  endowment_pageHome: 4,
  snap_manageAccounts: 3,
  endowment_keyring: 4,
  endowment_nameLookup: 3,
  endowment_signatureInsight: 4,
  connection_permission: 3,
  unknown_permission: 3,
});

export * from './snaps/permissions';
