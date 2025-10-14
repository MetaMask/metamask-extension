// Please do not add any more items to this list.
// This list is temporary and the goal is to reduce it to 0, meaning all requests are mocked in our e2e tests.
const ALLOWLISTED_URLS = [
  // Snaps
  'https://acl.execution.metamask.io/latest/registry.json',
  'https://acl.execution.metamask.io/latest/signature.json',
  'https://metamask.github.io/eth-ledger-bridge-keyring',
  'https://metamask.github.io/eth-ledger-bridge-keyring/',
  'https://metamask.github.io/eth-ledger-bridge-keyring/bundle.js',
  'https://metamask.github.io/ledger-iframe-bridge/8.0.3/',
  'https://metamask.github.io/ledger-iframe-bridge/8.0.3/assets/index-j_SGnqki.js',
  'https://metamask.github.io/ledger-iframe-bridge/8.0.3/assets/vendor-BlXVsT1S.js',
  'https://metamask.github.io/snaps/test-snaps/2.28.1',
  'https://metamask.github.io/snaps/test-snaps/2.28.1/',
  'https://metamask.github.io/snaps/test-snaps/2.28.1/main.js',
  'https://metamask.github.io/snaps/test-snaps/2.28.1/test-data.json',
  // Vault Decryptor
  'https://metamask.github.io/vault-decryptor',
  'https://metamask.github.io/vault-decryptor/',
  'https://metamask.github.io/vault-decryptor/bundle.js',
];

module.exports = { ALLOWLISTED_URLS };
