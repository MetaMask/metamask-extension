export const EndowmentPermissions = Object.freeze({
  'endowment:network-access': 'endowment:network-access',
  'endowment:transaction-insight': 'endowment:transaction-insight',
  'endowment:cronjob': 'endowment:cronjob',
  'endowment:ethereum-provider': 'endowment:ethereum-provider',
  'endowment:rpc': 'endowment:rpc',
  'endowment:webassembly': 'endowment:webassembly',
  'endowment:lifecycle-hooks': 'endowment:lifecycle-hooks',
  'endowment:page-home': 'endowment:page-home',
  'endowment:page-settings': 'endowment:page-settings',
  'endowment:signature-insight': 'endowment:signature-insight',
  'endowment:name-lookup': 'endowment:name-lookup',
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  'endowment:keyring': 'endowment:keyring',
  ///: END:ONLY_INCLUDE_IF
} as const);

// Methods / permissions in external packages that we are temporarily excluding.
export const ExcludedSnapPermissions = Object.freeze({});

export const ExcludedSnapEndowments = Object.freeze({
  'endowment:caip25':
    'eth_accounts is disabled. For more information please see https://github.com/MetaMask/snaps/issues/990.',
});

export const DynamicSnapPermissions = Object.freeze(['endowment:caip25']);
