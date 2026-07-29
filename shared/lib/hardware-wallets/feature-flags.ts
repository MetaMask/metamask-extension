/**
 * Hardware Wallet Feature Flag constants.
 *
 * Centralizes the string keys used to read hardware-wallet-related remote
 * feature flags so they can be type-checked at compile time and discovered
 * by the CI feature-flag registry analyzer.
 */

/**
 * Remote feature flag key for the Ledger DMK (Device Management Key) rollout.
 *
 * Flag shape (version-gated):
 * Enabled variant: `{ enabled: true, featureVersion: '13.42.0', minimumVersion: '13.42.0' }`
 * Disabled (production default): `{ enabled: false, featureVersion: null, minimumVersion: null }`
 *
 * Use `getBooleanFeatureFlag` to resolve the value at runtime; it returns
 * `false` for the disabled variant and only returns `true` when the current
 * extension version meets `minimumVersion`.
 */
export const ENABLE_DMK_FEATURE_FLAG = 'ledgerDmk';
