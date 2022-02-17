export const CaveatTypes = Object.freeze({
  restrictReturnedAccounts: 'restrictReturnedAccounts',
});

export const RestrictedMethods = Object.freeze({
  eth_accounts: 'eth_accounts',
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  snap_confirm: 'snap_confirm',
  snap_manageState: 'snap_manageState',
  'snap_getBip44Entropy_*': 'snap_getBip44Entropy_*',
  'wallet_snap_*': 'wallet_snap_*',
  ///: END:ONLY_INCLUDE_IN
});

///: BEGIN:ONLY_INCLUDE_IN(flask)
export const PermissionNamespaces = Object.freeze({
  snap_getBip44Entropy_: 'snap_getBip44Entropy_*',
  wallet_snap_: 'wallet_snap_*',
});

export const EndowmentPermissions = Object.freeze({
  'endowment:network-access': 'endowment:network-access',
});
///: END:ONLY_INCLUDE_IN
