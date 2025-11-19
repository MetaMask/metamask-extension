// Please do not add any more items to this list.
// This list is temporary and the goal is to reduce it to 0, meaning all requests are mocked in our e2e tests.
const ALLOWLISTED_URLS = [
  // Snaps
  'https://acl.execution.metamask.io/latest/registry.json',
  'https://acl.execution.metamask.io/latest/signature.json',
  // Vault Decryptor
  'https://metamask.github.io/vault-decryptor',
  'https://metamask.github.io/vault-decryptor/',
  'https://metamask.github.io/vault-decryptor/bundle.js',
];

module.exports = { ALLOWLISTED_URLS };
