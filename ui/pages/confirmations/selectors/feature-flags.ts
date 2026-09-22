import { createSelector } from 'reselect';
import type { Hex } from '@metamask/utils';
import {
  getEnforcedSimulationsSlippage,
  getIsEnforcedSimulationsEnabled,
} from '../../../../shared/lib/transaction/enforced-simulations';
import { getIsPayAmountPrefillEnabled } from '../../../../shared/lib/transaction/pay-prefill';
import { getRemoteFeatureFlags } from '../../../../shared/lib/selectors/remote-feature-flags';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getDepositLimits } from '../utils/pay-deposit-limit';
import {
  getRelayFixedSpreadFromConfig,
  type RelayFixedSpreadConfig,
} from '../utils/relay-fixed-spread';

export const RELAY_FIXED_SPREAD_FEATURE_FLAG =
  'confirmations_relay_fixed_spread';

export const STABLE_TOKENS_FEATURE_FLAG = 'stableTokens';

/**
 * USD-pegged tokens used when the `stableTokens` remote flag is absent or
 * malformed. Kept in sync with mobile's `DEFAULT_STABLECOINS` so both clients
 * value the same tokens at exactly $1.
 *
 * Addresses must be lowercase — lookups normalise the requested address before
 * comparing.
 *
 * Deliberately separate from `STABLECOIN_ASSET_IDS` (bridge slippage) and
 * `StablecoinsByChainId` (swaps): those lists serve different purposes, omit
 * MUSD and pUSD, and must not silently widen the set of tokens priced at $1.
 */
const DEFAULT_STABLECOINS: Record<Hex, Hex[]> = {
  [CHAIN_IDS.MAINNET]: [
    '0xaca92e438df0b2401ff60da7e4337b687a2435da', // MUSD
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  ],
  [CHAIN_IDS.ARBITRUM]: [
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC
  ],
  [CHAIN_IDS.LINEA_MAINNET]: [
    '0xaca92e438df0b2401ff60da7e4337b687a2435da', // MUSD
    '0x176211869ca2b568f2a7d4ee941e073a821ee1ff', // USDC
    '0xa219439258ca9da29e9cc4ce5596924745e12b93', // USDT
  ],
  [CHAIN_IDS.POLYGON]: [
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC.e
    '0xc011a7e12a19f7b1f670d46f03b03f3342e82dfb', // pUSD
  ],
};

/**
 * Lowercases chain IDs and addresses so flag data from LaunchDarkly can be
 * compared directly against normalised request values. Entries whose value is
 * not an array of addresses are dropped.
 *
 * @param raw - Raw `stableTokens` flag object.
 * @returns Map of lowercase chain ID to lowercase addresses.
 */
function normalizeStablecoins(
  raw: Record<string, unknown>,
): Record<Hex, Hex[]> {
  return Object.entries(raw).reduce<Record<Hex, Hex[]>>(
    (acc, [chainId, addresses]) => {
      if (Array.isArray(addresses)) {
        acc[chainId.toLowerCase() as Hex] = addresses
          .filter((address): address is string => typeof address === 'string')
          .map((address) => address.toLowerCase() as Hex);
      }
      return acc;
    },
    {},
  );
}

/**
 * USD-pegged tokens by chain ID, from the `stableTokens` remote feature flag.
 *
 * A remote value replaces the defaults wholesale rather than merging, so the
 * flag is the complete list when it supplies one.
 *
 * Falls back to {@link DEFAULT_STABLECOINS} when the flag is missing, is not a
 * keyed object, or carries no per-chain address arrays. That last case matters:
 * the extension distribution currently serves `{ enabled: false }`, a different
 * shape to mobile's `Record<chainId, address[]>`. Treating that as an empty map
 * would silently disable the peg and leave stablecoins mispriced, so we use the
 * defaults until the flag is populated for the extension.
 *
 * Consequently this flag cannot currently switch the peg off; it can only
 * override which tokens are pegged. Setting `stableTokens` to a populated map
 * is the supported way to change behaviour.
 */
export const selectStablecoins = createSelector(
  getRemoteFeatureFlags,
  (flags): Record<Hex, Hex[]> => {
    const flag = (flags as unknown as Record<string, unknown>)?.[
      STABLE_TOKENS_FEATURE_FLAG
    ];

    if (flag && typeof flag === 'object' && !Array.isArray(flag)) {
      const normalized = normalizeStablecoins(flag as Record<string, unknown>);

      if (Object.keys(normalized).length > 0) {
        return normalized;
      }
    }

    return DEFAULT_STABLECOINS;
  },
);

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
 * Minimum `token.fiat.balance` required when auto-selecting preferred or
 * no-fee pay tokens, from `confirmations_pay_tokens`. Same unit as
 * `fiat.balance` (user preferred currency), not token units. Matches mobile.
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
  defaultPaySelectedSection?: Record<string, string>;
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
 * Map of transaction types whose default pay method is Money Account, from
 * `confirmations_pay_extended.defaultPaySelectedSection`. Values are section
 * ids; `"money-account"` selects the Money Account row.
 */
export const selectDefaultPaySelectedSection = createSelector(
  selectPayExtendedFlag,
  (flag): Record<string, string> => flag?.defaultPaySelectedSection ?? {},
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
