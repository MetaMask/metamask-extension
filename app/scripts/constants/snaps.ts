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
  // Add the following to the list only if the build is Flask or Experimental
  // This cannot say `isFlask() || isExperimental()` because the swc compiler will not inline and exclude properly
  ...(process.env.METAMASK_BUILD_TYPE === 'flask' ||
  process.env.METAMASK_BUILD_TYPE === 'experimental'
    ? [
        new URL(
          '@metamask/account-watcher/dist/preinstalled-snap.json',
          // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
          import.meta.url,
        ),
      ]
    : []),
  // Add the following to the list only if the build is Flask
  // This cannot say `isFlask()` because the swc compiler will not inline and exclude properly
  ...(process.env.METAMASK_BUILD_TYPE === 'flask'
    ? [
        new URL(
          '@metamask/preinstalled-example-snap/dist/preinstalled-snap.json',
          // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
          import.meta.url,
        ),
      ]
    : []),
  new URL(
    '@metamask/bitcoin-wallet-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  new URL(
    '@metamask/solana-wallet-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
  new URL(
    '@metamask/tron-wallet-snap/dist/preinstalled-snap.json',
    // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
    import.meta.url,
  ),
];
