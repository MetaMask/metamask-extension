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
  'https://metamask.github.io/snap-account-abstraction-keyring/0.5.0/',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.5.0/72585f70-0b8c9d47690d7fe2ac87.js',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.5.0/app-27784e6248e8644fa873.js',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.5.0/component---src-pages-index-tsx-65d9e73b6aea71652319.js',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.5.0/f36c6662-e3e593644ccdf91e0df1.js',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.5.0/framework-7f36badc7ddb1e3597e8.js',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.5.0/page-data/app-data.json',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.5.0/page-data/index/page-data.json',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.5.0/webpack-runtime-eb27ff9e27bd689ff465.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.6/',
  'https://metamask.github.io/snap-simple-keyring/1.1.6/72585f70-b0685205a809efe121dc.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.6/f36c6662-7e78236bba23a76b6101.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.6/app-f4c2969992b9afb13e7f.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.6/component---src-pages-index-tsx-1bd38618fcde51a7fab0.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.6/framework-fe667a09be4a08a9b5f4.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.6/page-data/app-data.json',
  'https://metamask.github.io/snap-simple-keyring/1.1.6/page-data/index/page-data.json',
  'https://metamask.github.io/snap-simple-keyring/1.1.6/webpack-runtime-f26b9ef4aabef2136bf7.js',
  'https://metamask.github.io/snaps/test-snaps/2.28.1',
  'https://metamask.github.io/snaps/test-snaps/2.28.1/',
  'https://metamask.github.io/snaps/test-snaps/2.28.1/main.js',
  'https://metamask.github.io/snaps/test-snaps/2.28.1/test-data.json',
  // Swaps
  'https://swap.api.cx.metamask.io/networks/1',
  'https://swap.api.cx.metamask.io/networks/1/trades?destinationToken=0x6b175474e89094c44da98b954eedeac495271d0f&sourceToken=0x0000000000000000000000000000000000000000&sourceAmount=1000000000000000&slippage=2&timeout=10000&walletAddress=0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
  'https://swap.api.cx.metamask.io/networks/1/trades?destinationToken=0x6b175474e89094c44da98b954eedeac495271d0f&sourceToken=0x0000000000000000000000000000000000000000&sourceAmount=2000000000000000000&slippage=2&timeout=10000&walletAddress=0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
  'https://swap.api.cx.metamask.io/networks/1/trades?destinationToken=0x6b175474e89094c44da98b954eedeac495271d0f&sourceToken=0x0000000000000000000000000000000000000000&sourceAmount=3000000000000000&slippage=2&timeout=10000&walletAddress=0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
  'https://swap.api.cx.metamask.io/networks/1/trades?destinationToken=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&sourceToken=0x0000000000000000000000000000000000000000&sourceAmount=1000000000000000&slippage=2&timeout=10000&walletAddress=0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
  'https://swap.api.cx.metamask.io/networks/1/trades?destinationToken=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&sourceToken=0x0000000000000000000000000000000000000000&sourceAmount=50000000000000000000&slippage=2&timeout=10000&walletAddress=0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
  'https://swap.metaswap.codefi.network/networks/1/topAssets',
  // Vault Decryptor
  'https://metamask.github.io/vault-decryptor',
  'https://metamask.github.io/vault-decryptor/',
  'https://metamask.github.io/vault-decryptor/bundle.js',
];

module.exports = { ALLOWLISTED_URLS };
