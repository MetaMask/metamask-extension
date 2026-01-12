/**
 * Performance benchmark flows
 *
 * Re-exports all performance benchmark implementations for easy importing.
 *
 * NOTE: These benchmarks only run on Chrome + Browserify to reduce CI runtime.
 */

export { onboardingImportWalletBenchmark } from './onboarding-import-wallet';
export { onboardingNewWalletBenchmark } from './onboarding-new-wallet';
export { assetDetailsBenchmark } from './asset-details';
export { solanaAssetDetailsBenchmark } from './solana-asset-details';
