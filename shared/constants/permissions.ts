///: BEGIN:ONLY_INCLUDE_IN(flask)
import { isMain } from './flask';
///: END:ONLY_INCLUDE_IN

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

export const PermissionNamespaces = Object.freeze({
  wallet_snap_: 'wallet_snap_*',
} as const);

const StableEndowmentPermissions = Object.freeze({
  'endowment:network-access': 'endowment:network-access',
  'endowment:transaction-insight': 'endowment:transaction-insight',
  'endowment:cronjob': 'endowment:cronjob',
  'endowment:ethereum-provider': 'endowment:ethereum-provider',
  'endowment:rpc': 'endowment:rpc',
} as const);

const FlaskEndowmentPermissions = Object.freeze({
  ...StableEndowmentPermissions,
  'endowment:long-running': 'endowment:long-running',
} as const);

// Methods / permissions in external packages that we are temporarily excluding.
const ExcludedFlaskSnapPermissions = {
  eth_accounts:
    'eth_accounts is disabled. For more information please see https://github.com/MetaMask/snaps-monorepo/issues/990.',
};
const ExcludedStableSnapPermissions = {
  eth_accounts:
    'eth_accounts is disabled. For more information please see https://github.com/MetaMask/snaps-monorepo/issues/990.',
};
const ExcludedStableSnapEndowments = {
  'endowment:keyring': 'This endowment is not available',
  'endowment:long-running':
    'endowment:long-running is deprecated. For more information please see https://github.com/MetaMask/snaps-monorepo/issues/945. ',
};

const ExcludedFlaskSnapEndowments = {
  'endowment:keyring': 'This endowment is not available',
};

export const EndowmentPermissions = isMain
  ? StableEndowmentPermissions
  : FlaskEndowmentPermissions;

export const ExcludedSnapPermissions = isMain
  ? ExcludedStableSnapPermissions
  : ExcludedFlaskSnapPermissions;

export const ExcludedSnapEndowments = isMain
  ? ExcludedStableSnapEndowments
  : ExcludedFlaskSnapEndowments;
///: END:ONLY_INCLUDE_IN
