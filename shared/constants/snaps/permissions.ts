export const EndowmentPermissions = Object.freeze({
  'endowment:network-access': 'endowment:network-access',
  'endowment:transaction-insight': 'endowment:transaction-insight',
  'endowment:cronjob': 'endowment:cronjob',
  'endowment:ethereum-provider': 'endowment:ethereum-provider',
  'endowment:rpc': 'endowment:rpc',
  'endowment:webassembly': 'endowment:webassembly',
  'endowment:name-lookup': 'endowment:name-lookup',
  ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
  'endowment:long-running': 'endowment:long-running',
  ///: END:ONLY_INCLUDE_IN
} as const);

// Methods / permissions in external packages that we are temporarily excluding.
export const ExcludedSnapPermissions = Object.freeze({
  eth_accounts:
    'eth_accounts is disabled. For more information please see https://github.com/MetaMask/snaps-monorepo/issues/990.',
});

export const ExcludedSnapEndowments = Object.freeze({
  'endowment:keyring':
    'This endowment is still in development therefore not available.',
  ///: BEGIN:ONLY_INCLUDE_IN(build-main)
  'endowment:long-running':
    'endowment:long-running is deprecated. For more information please see https://github.com/MetaMask/snaps-monorepo/issues/945.',
  ///: END:ONLY_INCLUDE_IN
});
