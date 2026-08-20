import { createSelector } from 'reselect';
import type { Hex } from '@metamask/utils';
import {
  getEnforcedSimulationsSlippage,
  getIsEnforcedSimulationsEnabled,
} from '../../../../shared/lib/transaction/enforced-simulations';
import { getIsPayAmountPrefillEnabled } from '../../../../shared/lib/transaction/pay-prefill';
import { getRemoteFeatureFlags } from '../../../../shared/lib/selectors/remote-feature-flags';
import { getDepositLimits } from '../utils/pay-deposit-limit';
import {
  getRelayFixedSpreadFromConfig,
  type RelayFixedSpreadConfig,
} from '../utils/relay-fixed-spread';

export const RELAY_FIXED_SPREAD_FEATURE_FLAG =
  'confirmations_relay_fixed_spread';

type ConfirmationsPayDappsFlag = {
  enabled?: boolean;
};

export type PayPostQuoteConfig = {
  enabled?: boolean;
  tokens?: Record<Hex, Hex[]>;
};

type RawPayPostQuoteFlag = {
  default?: PayPostQuoteConfig;
  overrides?: Record<string, PayPostQuoteConfig>;
  [transactionType: string]:
    | PayPostQuoteConfig
    | Record<string, PayPostQuoteConfig>
    | undefined;
};

export type PreferredPayToken = {
  address: Hex;
  chainId: Hex;
  name?: string;
};

const EMPTY_PREFERRED_PAY_TOKENS: PreferredPayToken[] = [];

type PreferredTokensConfig = {
  default?: PreferredPayToken[] | Record<string, PreferredPayToken[]>;
  overrides?: Record<string, PreferredPayToken[]>;
  [transactionType: string]:
    | PreferredPayToken[]
    | Record<string, PreferredPayToken[]>
    | undefined;
};

export type BlockedPayTokenEntry = {
  address: string;
  chainId: string;
};

export type BlockedPayTokensListConfig = {
  chainIds?: string[];
  tokens?: BlockedPayTokenEntry[];
};

export type BlockedPayTokensConfig = {
  default?: BlockedPayTokensListConfig;
  overrides?: Record<string, BlockedPayTokensListConfig>;
};

type RawPayTokensFlag = {
  preferredTokens?: PreferredTokensConfig;
  blockedTokens?: BlockedPayTokensConfig;
  minimumRequiredTokenBalance?: number;
};

type HardwareWalletConfig = {
  enabled?: boolean;
};

const selectConfirmationsPayDappsFlag = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    /* eslint-disable @typescript-eslint/naming-convention */
    (
      flags as unknown as {
        confirmations_pay_dapps?: ConfirmationsPayDappsFlag;
      }
    ).confirmations_pay_dapps,
  /* eslint-enable @typescript-eslint/naming-convention */
);

export const selectIsMetaMaskPayDappsEnabled = createSelector(
  selectConfirmationsPayDappsFlag,
  (flag): boolean => flag?.enabled ?? false,
);

const selectPayPostQuoteFlag = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    /* eslint-disable @typescript-eslint/naming-convention */
    (
      flags as unknown as {
        confirmations_pay_post_quote?: RawPayPostQuoteFlag;
      }
    ).confirmations_pay_post_quote,
  /* eslint-enable @typescript-eslint/naming-convention */
);

const selectPayTokensFlag = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    /* eslint-disable @typescript-eslint/naming-convention */
    (
      flags as unknown as {
        confirmations_pay_tokens?: RawPayTokensFlag;
      }
    ).confirmations_pay_tokens,
  /* eslint-enable @typescript-eslint/naming-convention */
);

const selectPayHardwareFlag = createSelector(
  getRemoteFeatureFlags,
  /* eslint-disable @typescript-eslint/naming-convention */
  (flags) =>
    (
      flags as unknown as {
        confirmations_pay_hardware?: HardwareWalletConfig;
      }
    ).confirmations_pay_hardware,
  /* eslint-enable @typescript-eslint/naming-convention */
);

/**
 * Resolves the effective post-quote config for a given transaction type.
 * Transaction-specific config may be supplied either as
 * `overrides[transactionType]` (mobile-compatible) or directly at
 * `[transactionType]` (for example, `perpsWithdraw.tokens`).
 * @param _state
 * @param transactionType
 */
export const selectPayQuoteConfig = createSelector(
  [
    selectPayPostQuoteFlag,
    (_state, transactionType?: string) => transactionType,
  ],
  (flag, transactionType): PayPostQuoteConfig => {
    const defaultConfig: PayPostQuoteConfig = {
      enabled: flag?.default?.enabled ?? false,
      tokens: flag?.default?.tokens,
    };

    const transactionConfig = transactionType
      ? (flag?.overrides?.[transactionType] ??
        (flag?.[transactionType] as PayPostQuoteConfig | undefined))
      : undefined;

    if (!transactionConfig) {
      return defaultConfig;
    }

    return {
      enabled: transactionConfig.enabled ?? defaultConfig.enabled,
      tokens: transactionConfig.tokens ?? defaultConfig.tokens,
    };
  },
);

/**
 * Resolves whether the amount field should be pre-filled with the max balance
 * for a given transaction type. Transaction-specific config may be supplied
 * either as `overrides[transactionType]` or directly at `[transactionType]`.
 * @param _state
 * @param transactionType
 */
export const selectIsPayAmountPrefillEnabled = createSelector(
  [
    getRemoteFeatureFlags,
    (_state, transactionType?: string) => transactionType,
  ],
  (remoteFeatureFlags, transactionType): boolean =>
    getIsPayAmountPrefillEnabled({ remoteFeatureFlags }, transactionType),
);

/**
 * Per-transaction-type USD deposit limits from
 * `confirmations_pay_extended.depositLimit`. Empty map when unset.
 */
export const selectDepositLimits = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): Record<string, number> =>
    getDepositLimits({ remoteFeatureFlags }),
);

/**
 * Preferred MM Pay tokens for a transaction type from
 * `confirmations_pay_tokens.preferredTokens`. Transaction-specific
 * `overrides[transactionType]` (or a direct `[transactionType]` key) take
 * precedence over `default`.
 *
 * @param _state
 * @param transactionType
 */
export const selectPreferredPayTokens = createSelector(
  [selectPayTokensFlag, (_state, transactionType?: string) => transactionType],
  (flag, transactionType): PreferredPayToken[] =>
    getPreferredTokensForTransaction(flag?.preferredTokens, transactionType) ??
    EMPTY_PREFERRED_PAY_TOKENS,
);

export const selectPreferredPayToken = createSelector(
  [selectPreferredPayTokens],
  (preferredTokens): PreferredPayToken | undefined => preferredTokens[0],
);

/**
 * Resolves the MM Pay token blocklist for a transaction type from the
 * `confirmations_pay_tokens` remote feature flag. Transaction-specific
 * `overrides[transactionType]` take precedence over `default`.
 *
 * @param _state
 * @param transactionType
 */
export const selectBlockedPayTokens = createSelector(
  [selectPayTokensFlag, (_state, transactionType?: string) => transactionType],
  (flag, transactionType): BlockedPayTokensListConfig => {
    const blockedTokens = flag?.blockedTokens;
    const config =
      (transactionType && blockedTokens?.overrides?.[transactionType]) ||
      blockedTokens?.default;

    return {
      chainIds: config?.chainIds ?? [],
      tokens: config?.tokens ?? [],
    };
  },
);

/**
 * Minimum fiat balance required when auto-selecting a pay token, from the
 * `confirmations_pay_tokens` remote feature flag.
 */
export const selectMinimumRequiredTokenBalance = createSelector(
  selectPayTokensFlag,
  (flag): number => flag?.minimumRequiredTokenBalance ?? 0,
);

export const selectIsEnforcedSimulationsEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): boolean =>
    getIsEnforcedSimulationsEnabled({ remoteFeatureFlags }),
);

export const selectEnforcedSimulationsSlippage = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): number =>
    getEnforcedSimulationsSlippage({ remoteFeatureFlags }),
);

export const selectIsPayHardwareEnabled = createSelector(
  selectPayHardwareFlag,
  (flag): boolean => flag?.enabled ?? false,
);

type PayExtendedFlag = {
  enableMoneyAccountTransactions?: Record<string, boolean>;
};

const selectPayExtendedFlag = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    /* eslint-disable @typescript-eslint/naming-convention */
    (
      flags as unknown as {
        confirmations_pay_extended?: PayExtendedFlag;
      }
    ).confirmations_pay_extended,
  /* eslint-enable @typescript-eslint/naming-convention */
);

/**
 * Map of transaction types that may use Money Account as a pay method, from
 * `confirmations_pay_extended.enableMoneyAccountTransactions`.
 */
export const selectEnableMoneyAccountTransactions = createSelector(
  selectPayExtendedFlag,
  (flag): Record<string, boolean> => flag?.enableMoneyAccountTransactions ?? {},
);

/**
 * Whether Money Account pay is enabled for a given transaction type.
 *
 * @param _state
 * @param transactionType
 */
export const selectIsMoneyAccountTransactionEnabled = createSelector(
  [
    selectEnableMoneyAccountTransactions,
    (_state, transactionType?: string) => transactionType,
  ],
  (enableMoneyAccountTransactions, transactionType): boolean =>
    Boolean(transactionType && enableMoneyAccountTransactions[transactionType]),
);

/**
 * Parses the `confirmations_relay_fixed_spread` remote feature flag into a
 * normalised route config used to identify no-fee Money Account deposit tokens.
 */
export const selectRelayFixedSpread = createSelector(
  getRemoteFeatureFlags,
  (flags): RelayFixedSpreadConfig =>
    getRelayFixedSpreadFromConfig(
      (
        flags as unknown as {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          confirmations_relay_fixed_spread?: unknown;
        }
      ).confirmations_relay_fixed_spread,
      RELAY_FIXED_SPREAD_FEATURE_FLAG,
    ),
);

function getPreferredTokensForTransaction(
  config?: PreferredTokensConfig,
  transactionType?: string,
): PreferredPayToken[] | undefined {
  if (!config) {
    return undefined;
  }

  const defaultTokens = normalizePreferredPayTokens(config.default);
  const transactionTokens = transactionType
    ? normalizePreferredPayTokens(
        config.overrides?.[transactionType] ?? config[transactionType],
      )
    : undefined;

  return transactionTokens ?? defaultTokens;
}

function normalizePreferredPayTokens(
  value?: PreferredPayToken[] | Record<string, PreferredPayToken[]>,
): PreferredPayToken[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const tokens = value.filter(isPreferredPayToken);
  return tokens.length ? tokens : undefined;
}

function isPreferredPayToken(value: unknown): value is PreferredPayToken {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PreferredPayToken).address === 'string' &&
    typeof (value as PreferredPayToken).chainId === 'string'
  );
}
