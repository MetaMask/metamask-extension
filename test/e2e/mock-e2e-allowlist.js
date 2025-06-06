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
  'https://metamask.github.io/snap-account-abstraction-keyring/0.4.1/',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.4.1/72585f70-0b8c9d47690d7fe2ac87.js',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.4.1/app-acf97414441c8da8c710.js',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.4.1/component---src-pages-index-tsx-5cfb3411e9d4665335b8.js',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.4.1/f36c6662-e3e593644ccdf91e0df1.js',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.4.1/framework-7f36badc7ddb1e3597e8.js',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.4.1/page-data/500.html/page-data.json',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.4.1/page-data/app-data.json',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.4.1/page-data/index/page-data.json',
  'https://metamask.github.io/snap-account-abstraction-keyring/0.4.1/webpack-runtime-aa57915fb3e4eb554525.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.2/',
  'https://metamask.github.io/snap-simple-keyring/1.1.6/',
  'https://metamask.github.io/snap-simple-keyring/1.1.2/72585f70-b0685205a809efe121dc.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.2/app-5331ee4ad1d5e0ac8d54.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.2/component---src-pages-index-tsx-1a885d3a2aa4b3b7a091.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.2/f36c6662-7e78236bba23a76b6101.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.2/framework-fe667a09be4a08a9b5f4.js',
  'https://metamask.github.io/snap-simple-keyring/1.1.2/page-data/app-data.json',
  'https://metamask.github.io/snap-simple-keyring/1.1.2/page-data/index/page-data.json',
  'https://metamask.github.io/snap-simple-keyring/1.1.2/webpack-runtime-35853b86ee7228936852.js',
  'https://metamask.github.io/snaps/test-snaps/2.12.0/',
  'https://metamask.github.io/snaps/test-snaps/2.12.0/main.js',
  'https://metamask.github.io/snaps/test-snaps/2.12.0/test-data.json',
  'https://metamask.github.io/snaps/test-snaps/2.20.1',
];

const ALLOWLISTED_HOSTS = [
  'accounts.api.cx.metamask.io',
  'metamask.github.io',
  'solana-devnet.infura.io',
  'solana-mainnet.infura.io',
  'snaps.metamask.io',
  'start.metamask.io',
  'token.api.cx.metamask.io',
];

module.exports = { ALLOWLISTED_HOSTS, ALLOWLISTED_URLS };
