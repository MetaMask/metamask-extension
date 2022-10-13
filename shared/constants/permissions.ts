export const CaveatTypes = Object.freeze({
  restrictReturnedAccounts: 'restrictReturnedAccounts' as const,
});

export const RestrictedMethods = Object.freeze({
  eth_accounts: 'eth_accounts',
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  snap_confirm: 'snap_confirm',
  snap_notify: 'snap_notify',
  snap_manageState: 'snap_manageState',
  snap_getBip32PublicKey: 'snap_getBip32PublicKey',
  snap_getBip32Entropy: 'snap_getBip32Entropy',
  snap_getBip44Entropy: 'snap_getBip44Entropy',
  'wallet_snap_*': 'wallet_snap_*',
  ///: END:ONLY_INCLUDE_IN
} as const);

///: BEGIN:ONLY_INCLUDE_IN(flask)
export const PermissionNamespaces = Object.freeze({
  wallet_snap_: 'wallet_snap_*',
} as const);

export const EndowmentPermissions = Object.freeze({
  'endowment:network-access': 'endowment:network-access',
  'endowment:long-running': 'endowment:long-running',
  'endowment:transaction-insight': 'endowment:transaction-insight',
} as const);

// Methods / permissions in external packages that we are temporarily excluding.
export const ExcludedSnapPermissions = new Set(['snap_dialog']);
export const ExcludedSnapEndowments = new Set(['endowment:keyring']);
///: END:ONLY_INCLUDE_IN
