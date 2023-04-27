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
/**
 * Exclude permissions by code fencing them to avoid any potential usage of excluded permissions at runtime. See: https://github.com/MetaMask/metamask-extension/pull/17321#pullrequestreview-1287014285.
 * This is a fix for https://github.com/MetaMask/snaps-monorepo/issues/1103 and https://github.com/MetaMask/snaps-monorepo/issues/990.
 * TODO: Disable endowment:long-running and eth_account in stable.
 */
export const EndowmentPermissions = Object.freeze({
  'endowment:network-access': 'endowment:network-access',
  'endowment:transaction-insight': 'endowment:transaction-insight',
  'endowment:cronjob': 'endowment:cronjob',
  'endowment:ethereum-provider': 'endowment:ethereum-provider',
  'endowment:rpc': 'endowment:rpc',
  'endowment:long-running': 'endowment:long-running',
  'endowment:webassembly': 'endowment:webassembly',
} as const);

// Methods / permissions in external packages that we are temporarily excluding.
export const ExcludedSnapPermissions = Object.freeze({
  eth_accounts:
    'eth_accounts is disabled. For more information please see https://github.com/MetaMask/snaps-monorepo/issues/990.',
});

export const ExcludedSnapEndowments = Object.freeze({
  'endowment:keyring':
    'This endowment is still in development therefore not available.',
});
///: END:ONLY_INCLUDE_IN
