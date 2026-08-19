import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import {
  PAY_EXTENDED_FEATURE_FLAG,
  type PayPrefilledAmountConfig,
} from '../../../../../shared/lib/transaction/pay-prefill';
import { getRemoteFeatureFlags } from '../../../../../shared/lib/selectors/remote-feature-flags';
import {
  selectDepositLimits,
  selectRelayFixedSpread,
} from '../../selectors/feature-flags';
import { getDepositLimitForTransaction } from '../../utils/pay-deposit-limit';
import { isRouteToken } from '../../utils/relay-fixed-spread';
import { useTransactionPayToken } from '../pay/useTransactionPayToken';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';

function formatFiatAmount(value: BigNumber): string {
  return value.isInteger() ? value.toString(10) : value.toFixed(2);
}

function getPrefilledAmountConfig(
  remoteFeatureFlags: ReturnType<typeof getRemoteFeatureFlags>,
  transactionMeta?: TransactionMeta,
): PayPrefilledAmountConfig {
  const flag = remoteFeatureFlags?.[PAY_EXTENDED_FEATURE_FLAG] as
    | {
        prefilledAmount?: {
          default?: PayPrefilledAmountConfig;
          overrides?: Record<string, PayPrefilledAmountConfig>;
        };
      }
    | undefined;

  const prefilledAmount = flag?.prefilledAmount;
  const defaultConfig = prefilledAmount?.default ?? { enabled: false };

  if (!transactionMeta || !prefilledAmount?.overrides) {
    return defaultConfig;
  }

  for (const [type, config] of Object.entries(prefilledAmount.overrides)) {
    if (hasTransactionType(transactionMeta, [type as TransactionType])) {
      return config;
    }
  }

  return defaultConfig;
}

export type DepositPrefillResult = {
  prefillAmount: string | undefined;
  enabled: boolean;
  isLoading: boolean;
  hasPrefilled: boolean;
};

/**
 * Computes the fiat amount to pre-fill for money-account deposit confirmations.
 * Matches mobile `useDepositPrefillAmount`:
 * - Gated by `confirmations_pay_extended.prefilledAmount`
 * - 100% of balance for relay fixed-spread route tokens, otherwise 50%
 * - Capped by `confirmations_pay_extended.depositLimit` when configured
 * - Re-commits when the confirmation, pay token, or funding account changes
 */
export function useDepositPrefillAmount(): DepositPrefillResult {
  const transactionMeta = useTransactionMetadataRequest();
  const { payToken } = useTransactionPayToken();
  const accountOverride = useTransactionAccountOverride();
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const depositLimits = useSelector(selectDepositLimits);
  const relayFixedSpread = useSelector(selectRelayFixedSpread);

  const prefilledAmountConfig = useMemo(
    () => getPrefilledAmountConfig(remoteFeatureFlags, transactionMeta),
    [remoteFeatureFlags, transactionMeta],
  );

  const depositLimit = useMemo(
    () => getDepositLimitForTransaction(depositLimits, transactionMeta),
    [depositLimits, transactionMeta],
  );

  const enabled = Boolean(prefilledAmountConfig.enabled);

  // Keep balance as a string so BigNumber.times never receives a JS number with
  // >15 significant digits (throws in this bignumber.js version).
  const balanceUsd = String(payToken?.balanceUsd ?? 0);
  // The confirmation id is part of the key so a following deposit rendered by
  // the same mounted UI releases the commit and prefills again, instead of
  // inheriting the previous confirmation's amount.
  const tokenKey = `${transactionMeta?.id ?? ''}:${payToken?.address}:${payToken?.chainId}:${accountOverride ?? ''}`;
  const [committedKey, setCommittedKey] = useState<string | null>(null);

  const prefillAmount = useMemo(() => {
    const balanceUsdValue = new BigNumber(balanceUsd);

    if (
      !enabled ||
      !payToken ||
      !balanceUsdValue.isFinite() ||
      balanceUsdValue.lte(0)
    ) {
      return undefined;
    }

    const stable = isRouteToken(relayFixedSpread, {
      chainId: payToken.chainId,
      address: payToken.address,
    });
    const percentage = stable ? 100 : 50;

    const raw = new BigNumber(percentage)
      .div(100)
      .times(balanceUsdValue)
      .round(2, BigNumber.ROUND_DOWN);

    return formatFiatAmount(
      depositLimit === undefined
        ? raw
        : BigNumber.min(raw, String(depositLimit)),
    );
  }, [balanceUsd, depositLimit, enabled, payToken, relayFixedSpread]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (committedKey !== null && committedKey !== tokenKey) {
      setCommittedKey(null);
      return;
    }

    if (committedKey === null && prefillAmount !== undefined) {
      setCommittedKey(tokenKey);
    }
  }, [committedKey, enabled, prefillAmount, tokenKey]);

  const hasPrefilled = committedKey === tokenKey;
  const isLoading = enabled && !hasPrefilled;

  return { prefillAmount, isLoading, hasPrefilled, enabled };
}
