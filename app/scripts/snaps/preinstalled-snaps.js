const PREINSTALLED_SNAPS = Object.freeze([
  '@metamask/message-signing-snap',
  '@metamask/ens-resolver-snap',
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  '@metamask/account-watcher',
  '@metamask/preinstalled-example-snap',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  '@metamask/bitcoin-wallet-snap',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  '@metamask/solana-wallet-snap',
  ///: END:ONLY_INCLUDE_IF
]);

module.exports = { PREINSTALLED_SNAPS };