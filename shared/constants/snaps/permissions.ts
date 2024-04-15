export const EndowmentPermissions = Object.freeze({
  'endowment:network-access': 'endowment:network-access',
  'endowment:transaction-insight': 'endowment:transaction-insight',
  'endowment:cronjob': 'endowment:cronjob',
  'endowment:ethereum-provider': 'endowment:ethereum-provider',
  'endowment:rpc': 'endowment:rpc',
  'endowment:webassembly': 'endowment:webassembly',
  'endowment:lifecycle-hooks': 'endowment:lifecycle-hooks',
  'endowment:page-home': 'endowment:page-home',
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  'endowment:signature-insight': 'endowment:signature-insight',
  'endowment:name-lookup': 'endowment:name-lookup',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  'endowment:keyring': 'endowment:keyring',
  ///: END:ONLY_INCLUDE_IF
} as const);

// Methods / permissions in external packages that we are temporarily excluding.
export const ExcludedSnapPermissions = Object.freeze({
  eth_accounts:
    'eth_accounts is disabled. For more information please see https://github.com/MetaMask/snaps/issues/990.',
});

export const ExcludedSnapEndowments = Object.freeze({
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  'endowment:name-lookup':
    'This endowment is experimental and therefore not available.',
  'endowment:signature-insight':
    'This endowment is experimental and therefore not available.',
  ///: END:ONLY_INCLUDE_IF
});

export const DynamicSnapPermissions = Object.freeze(['eth_accounts']);
