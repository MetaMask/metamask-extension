export const CaveatTypes = Object.freeze({
  restrictReturnedAccounts: 'restrictReturnedAccounts' as const,
});

export const RestrictedMethods = Object.freeze({
  eth_accounts: 'eth_accounts',
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  snap_dialog: 'snap_dialog',
  snap_notify: 'snap_notify',
  snap_manageState: 'snap_manageState',
  snap_getBip32PublicKey: 'snap_getBip32PublicKey',
  snap_getBip32Entropy: 'snap_getBip32Entropy',
  snap_getBip44Entropy: 'snap_getBip44Entropy',
  snap_getEntropy: 'snap_getEntropy',
  wallet_snap: 'wallet_snap',
  ///: END:ONLY_INCLUDE_IN
} as const);

///: BEGIN:ONLY_INCLUDE_IN(snaps)
export * from './snaps/permissions';
///: END:ONLY_INCLUDE_IN
