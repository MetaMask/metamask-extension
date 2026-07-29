export const PAY_EXTENDED_FEATURE_FLAG = 'confirmations_pay_extended';

export type PayPrefilledAmountConfig = {
  enabled?: boolean;
};

type PrefilledAmountFlag = {
  default?: PayPrefilledAmountConfig;
  overrides?: Record<string, PayPrefilledAmountConfig>;
  [transactionType: string]:
    | PayPrefilledAmountConfig
    | Record<string, PayPrefilledAmountConfig>
    | undefined;
};

type PayExtendedFeatureFlag = {
  prefilledAmount?: PrefilledAmountFlag;
};

type FeatureFlagSource = {
  remoteFeatureFlags?: Record<string, unknown>;
};

/**
 * Resolves whether the amount field is pre-filled with the max balance for a
 * given transaction type, from the
 * `confirmations_pay_extended.prefilledAmount` remote feature flag.
 * Transaction-specific config may be supplied either as
 * `overrides[transactionType]` or directly at `[transactionType]`.
 *
 * @param source - An object holding the remote feature flags.
 * @param transactionType - The transaction type to resolve the config for.
 * @returns Whether amount prefill is enabled.
 */
export function getIsPayAmountPrefillEnabled(
  source: FeatureFlagSource,
  transactionType?: string,
): boolean {
  const flag = source.remoteFeatureFlags?.[PAY_EXTENDED_FEATURE_FLAG] as
    | PayExtendedFeatureFlag
    | undefined;

  const prefill = flag?.prefilledAmount;
  const defaultEnabled = prefill?.default?.enabled ?? false;

  const transactionConfig = transactionType
    ? (prefill?.overrides?.[transactionType] ??
      (prefill?.[transactionType] as PayPrefilledAmountConfig | undefined))
    : undefined;

  return transactionConfig?.enabled ?? defaultEnabled;
}
