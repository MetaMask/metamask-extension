import { createSelector } from 'reselect';
import { TransactionType } from '@metamask/transaction-controller';
import { getRemoteFeatureFlags } from '../../../selectors/remote-feature-flags';

type ConfirmationsPayDappsFlag = {
  enabled?: boolean;
};

export type PayPostQuoteConfig = {
  enabled?: boolean;
  tokens?: Record<string, string[]>;
};

export type PayPostQuoteFlags = {
  default?: PayPostQuoteConfig;
  overrides?: Record<string, PayPostQuoteConfig>;
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

const selectConfirmationsPayPostQuoteFlag = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    /* eslint-disable @typescript-eslint/naming-convention */
    (
      flags as unknown as {
        confirmations_pay_post_quote?: PayPostQuoteFlags;
      }
    ).confirmations_pay_post_quote,
  /* eslint-enable @typescript-eslint/naming-convention */
);

export const selectIsMetaMaskPayDappsEnabled = createSelector(
  selectConfirmationsPayDappsFlag,
  (flag): boolean => flag?.enabled ?? false,
);

const selectPerpsWithdrawPostQuoteConfig = createSelector(
  selectConfirmationsPayPostQuoteFlag,
  (flag): PayPostQuoteConfig => {
    const defaultConfig: PayPostQuoteConfig = {
      enabled: flag?.default?.enabled ?? false,
      tokens: flag?.default?.tokens,
    };
    const overrideConfig = flag?.overrides?.[TransactionType.perpsWithdraw];

    if (!overrideConfig) {
      return defaultConfig;
    }

    return {
      enabled: overrideConfig.enabled ?? defaultConfig.enabled,
      tokens: overrideConfig.tokens ?? defaultConfig.tokens,
    };
  },
);

export const selectIsPerpsWithdrawPostQuoteEnabled = createSelector(
  selectPerpsWithdrawPostQuoteConfig,
  (config): boolean => config.enabled === true,
);
