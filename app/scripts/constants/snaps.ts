export const PREINSTALLED_SNAPS = [
  'npm:@metamask/message-signing-snap',
  'npm:@metamask/ens-resolver-snap',
  'npm:@metamask/institutional-wallet-snap',
  'npm:@metamask/account-watcher',
  'npm:@metamask/preinstalled-example-snap',
  'npm:@metamask/bitcoin-wallet-snap',
  'npm:@metamask/solana-wallet-snap',
];

// Needed for webpack to analyze the preinstalled snaps
export const PREINSTALLED_SNAPS_URLS = [
  new URL(
    '@metamask/message-signing-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  new URL(
    '@metamask/ens-resolver-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  new URL(
    '@metamask/institutional-wallet-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  new URL(
    '@metamask/account-watcher/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  new URL(
    '@metamask/preinstalled-example-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  new URL(
    '@metamask/bitcoin-wallet-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  new URL(
    '@metamask/solana-wallet-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  ///: END:ONLY_INCLUDE_IF
];
