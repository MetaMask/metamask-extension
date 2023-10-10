export const EndowmentPermissions = Object.freeze({
  'endowment:network-access': 'endowment:network-access',
  'endowment:transaction-insight': 'endowment:transaction-insight',
  'endowment:cronjob': 'endowment:cronjob',
  'endowment:ethereum-provider': 'endowment:ethereum-provider',
  'endowment:rpc': 'endowment:rpc',
  'endowment:webassembly': 'endowment:webassembly',
  ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
  'endowment:lifecycle-hooks': 'endowment:lifecycle-hooks',
  'endowment:name-lookup': 'endowment:name-lookup',
  ///: END:ONLY_INCLUDE_IN
} as const);

// Methods / permissions in external packages that we are temporarily excluding.
export const ExcludedSnapPermissions = Object.freeze({
  // TODO: Enable in Flask
  ///: BEGIN:ONLY_INCLUDE_IN(build-main)
  snap_getLocale:
    'This permission is still in development and therefore not available.',
  snap_manageAccounts:
    'This permission is still in development and therefore not available.',
  ///: END:ONLY_INCLUDE_IN
  eth_accounts:
    'eth_accounts is disabled. For more information please see https://github.com/MetaMask/snaps/issues/990.',
});

export const ExcludedSnapEndowments = Object.freeze({
  // Move to below fence once implemented
  'endowment:keyring':
    'This endowment is still in development therefore not available.',
  ///: BEGIN:ONLY_INCLUDE_IN(build-main)
  'endowment:lifecycle-hooks':
    'This endowment is experimental and therefore not available.',
  'endowment:name-lookup':
    'This permission is still in development and therefore not available.',
  ///: END:ONLY_INCLUDE_IN
});

export const DynamicSnapPermissions = Object.freeze(['eth_accounts']);
