/**
 * Performance benchmark flows
 *
 * Re-exports all performance benchmark implementations for easy importing.
 *
 * NOTE: These benchmarks only run on Chrome + Browserify to reduce CI runtime.
 */

export { runOnboardingImportWalletBenchmark } from './onboarding-import-wallet';
export { runOnboardingNewWalletBenchmark } from './onboarding-new-wallet';
export { runAssetDetailsBenchmark } from './asset-details';
export { runSolanaAssetDetailsBenchmark } from './solana-asset-details';
