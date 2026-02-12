// Needed for webpack to analyze the preinstalled snaps
export const PREINSTALLED_SNAPS_URLS = [
  new URL(
    '@metamask/permissions-kernel-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  new URL(
    '@metamask/gator-permissions-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
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
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
  new URL(
    '@metamask/account-watcher/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
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
  new URL(
    '@metamask/solana-wallet-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  new URL(
    '@metamask/tron-wallet-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  ///: END:ONLY_INCLUDE_IF
];
