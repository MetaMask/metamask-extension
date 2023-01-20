export const CaveatTypes = Object.freeze({
  restrictReturnedAccounts: 'restrictReturnedAccounts' as const,
});

export const RestrictedMethods = Object.freeze({
  eth_accounts: 'eth_accounts',
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  snap_confirm: 'snap_confirm',
  snap_dialog: 'snap_dialog',
  snap_notify: 'snap_notify',
  snap_manageState: 'snap_manageState',
  snap_getBip32PublicKey: 'snap_getBip32PublicKey',
  snap_getBip32Entropy: 'snap_getBip32Entropy',
  snap_getBip44Entropy: 'snap_getBip44Entropy',
  snap_getEntropy: 'snap_getEntropy',
  'wallet_snap_*': 'wallet_snap_*',
  ///: END:ONLY_INCLUDE_IN
} as const);

///: BEGIN:ONLY_INCLUDE_IN(flask)
const isMain = process.env.METAMASK_BUILD_TYPE === 'main';

export const PermissionNamespaces = Object.freeze({
  wallet_snap_: 'wallet_snap_*',
} as const);

export const EndowmentPermissions = Object.freeze({
  'endowment:network-access': 'endowment:network-access',
  'endowment:long-running': 'endowment:long-running',
  'endowment:transaction-insight': 'endowment:transaction-insight',
  'endowment:cronjob': 'endowment:cronjob',
  'endowment:ethereum-provider': 'endowment:ethereum-provider',
  'endowment:rpc': 'endowment:rpc',
} as const);

// Methods / permissions in external packages that we are temporarily excluding.
export const ExcludedFlaskSnapPermissions = {
  eth_accounts:
    'eth_accounts is disabled. For more information please see https://github.com/MetaMask/snaps-monorepo/issues/990.',
};
export const ExcludedStableSnapPermissions = {
  eth_accounts:
    'eth_accounts is disabled. For more information please see https://github.com/MetaMask/snaps-monorepo/issues/990.',
};
export const ExcludedStableSnapEndowments = {
  'endowment:keyring': 'This endowment is not available',
  'endowment:long-running':
    'endowment:long-running is deprecated. For more information please see https://github.com/MetaMask/snaps-monorepo/issues/945. ',
};

export const ExcludedFlaskSnapEndowments = {
  'endowment:keyring': 'This endowment is not available',
};

export const ExcludedSnapPermissions = isMain
  ? ExcludedStableSnapPermissions
  : ExcludedFlaskSnapPermissions;

export const ExcludedSnapEndowments = isMain
  ? ExcludedStableSnapEndowments
  : ExcludedFlaskSnapEndowments;
///: END:ONLY_INCLUDE_IN
