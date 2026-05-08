import { createSelector } from 'reselect';
import type { Hex } from '@metamask/utils';
import {
  getEnforcedSimulationsSlippage,
  getIsEnforcedSimulationsEnabled,
} from '../../../../shared/lib/transaction/enforced-simulations';
import { getRemoteFeatureFlags } from '../../../selectors/remote-feature-flags';

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
