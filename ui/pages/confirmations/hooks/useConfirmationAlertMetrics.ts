// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { validate as isUuid } from 'uuid';

import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import useAlerts from '../../../hooks/useAlerts';
import { isSignatureTransactionType } from '../utils';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { useConfirmContext } from '../context/confirm';
import { AlertsName } from './alerts/constants';
import { useSignatureEventFragment } from './useSignatureEventFragment';
import { useTransactionEventFragment } from './useTransactionEventFragment';

export type AlertMetricsProperties = {
  alert_visualized: string[];
  alert_visualized_count: number;
  alert_key_clicked: string[];
  alert_action_clicked: string[];
};

export const ALERTS_NAME_METRICS: Record<AlertsName | string, string> = {
  [AlertsName.AddressPoisoning]: 'address_poisoning',
  [AlertsName.DepositLimit]: 'deposit_limit',
  [AlertsName.GasEstimateFailed]: 'gas_estimate_failed',
  [AlertsName.GasFeeLow]: 'gas_fee_low',
  [AlertsName.GasTooLow]: 'gas_too_low',
  [AlertsName.InsufficientBalance]: 'insufficient_balance',
  [AlertsName.NetworkBusy]: 'network_busy',
  [AlertsName.NoGasPrice]: 'no_gas_price',
  [AlertsName.PendingTransaction]: 'pending_transaction',
  [AlertsName.PerpsWithdrawBalanceUnavailable]:
    'perps_withdraw_balance_unavailable',
  [AlertsName.SigningOrSubmitting]: 'signing_or_submitting',
  [AlertsName.Blockaid]: 'blockaid',
};

/**
 * Alert keys that are suppressed from confirmation metrics for a given
 * transaction type, because the generic alert that produces them cannot
 * meaningfully apply to that flow.
 *
 * Money Account deposits are submitted as EIP-7702/ERC-7821 batches whose
 * outer call targets the Money Account itself, so the generic non-contract
 * address check fires on an address that has no code while the real calls
 * (mUSD token, teller) sit in `nestedTransactions`. The alert is left intact
 * for the UI; it is only excluded here so it does not skew rollout metrics.
 */
const EXCLUDED_ALERT_KEYS_BY_TRANSACTION_TYPE: [TransactionType, string[]][] = [
  [
    TransactionType.moneyAccountDeposit,
    [AlertsName.HexDataWhileInteractingWithNonContractAddress],
  ],
];

/**
 * Resolves the alert keys to omit from metrics for a confirmation.
 *
 * Matches on nested transactions as well as the top-level type, since pay
 * batches carry their meaningful type on a nested call.
 *
 * @param transactionMeta - The confirmation to inspect.
 * @returns The set of alert keys to exclude from metrics.
 */
function getExcludedAlertKeys(
  transactionMeta: TransactionMeta | undefined,
): Set<string> {
  const keys = EXCLUDED_ALERT_KEYS_BY_TRANSACTION_TYPE.filter(
    ([transactionType]) =>
      hasTransactionType(transactionMeta, [transactionType]),
  ).flatMap(([, alertKeys]) => alertKeys);

  return new Set(keys);
}

function uniqueFreshArrayPush<T>(array: T[], value: T): T[] {
  return [...new Set([...array, value])];
}

function getAlertNames(alerts: Alert[]): string[] {
  return alerts.map((alert) => getAlertName(alert.key));
}

function getAlertName(alertKey: string): string {
  return isUuid(alertKey)
    ? ALERTS_NAME_METRICS[AlertsName.Blockaid]
    : (ALERTS_NAME_METRICS[alertKey] ?? alertKey);
}

export function useConfirmationAlertMetrics() {
  const { currentConfirmation } = useConfirmContext();
  const ownerId = currentConfirmation?.id ?? '';

  const { alerts, isAlertConfirmed } = useAlerts(ownerId);

  const excludedAlertKeys = useMemo(
    () => getExcludedAlertKeys(currentConfirmation as TransactionMeta),
    [currentConfirmation],
  );

  // Filtered before the emptiness check below so that a confirmation whose
  // only alert is excluded reports no alert properties at all, rather than a
  // zeroed-out block it would not have emitted otherwise.
  const metricsAlerts = useMemo(
    () => alerts.filter((alert) => !excludedAlertKeys.has(alert.key)),
    [alerts, excludedAlertKeys],
  );

  const alertsProperties = useMemo(() => {
    if (metricsAlerts.length === 0) {
      return undefined;
    }

    const resolvedAlerts = metricsAlerts.filter((alert) =>
      isAlertConfirmed(alert.key),
    );

    return {
      alert_triggered_count: metricsAlerts.length,
      alert_triggered: getAlertNames(metricsAlerts),
      alert_resolved_count: resolvedAlerts.length,
      alert_resolved: getAlertNames(resolvedAlerts),
    };
  }, [metricsAlerts, isAlertConfirmed]);

  const { updateSignatureEventFragment } = useSignatureEventFragment();
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const [metricsProperties, setMetricsProperties] =
    useState<AlertMetricsProperties>({
      alert_visualized: [],
      alert_visualized_count: 0,
      alert_key_clicked: [],
      alert_action_clicked: [],
    });

  const properties = useMemo(() => {
    return alertsProperties
      ? { ...alertsProperties, ...metricsProperties }
      : undefined;
  }, [alertsProperties, metricsProperties]);

  const trackAlertRender = useCallback(
    (alertKey: string) => {
      if (excludedAlertKeys.has(alertKey)) {
        return;
      }

      setMetricsProperties((prevState) => {
        const newState = { ...prevState };
        const alertName = getAlertName(alertKey);
        newState.alert_visualized = uniqueFreshArrayPush(
          prevState.alert_visualized,
          alertName,
        );
        newState.alert_visualized_count = newState.alert_visualized.length;
        return newState;
      });
    },
    [excludedAlertKeys],
  );

  const trackInlineAlertClicked = useCallback(
    (alertKey: string) => {
      if (excludedAlertKeys.has(alertKey)) {
        return;
      }

      setMetricsProperties((prevState) => {
        const newState = { ...prevState };
        const alertName = getAlertName(alertKey);
        newState.alert_key_clicked = uniqueFreshArrayPush(
          prevState.alert_key_clicked,
          alertName,
        );
        return newState;
      });
    },
    [excludedAlertKeys],
  );

  const trackAlertActionClicked = useCallback(
    (alertKey: string) => {
      if (excludedAlertKeys.has(alertKey)) {
        return;
      }

      setMetricsProperties((prevState) => {
        const newState = { ...prevState };
        const alertName = getAlertName(alertKey);
        newState.alert_action_clicked = uniqueFreshArrayPush(
          prevState.alert_action_clicked,
          alertName,
        );
        return newState;
      });
    },
    [excludedAlertKeys],
  );

  const updateAlertMetrics = useCallback(() => {
    if (!properties) {
      return;
    }

    if (isSignatureTransactionType(currentConfirmation)) {
      updateSignatureEventFragment({ properties });
    } else {
      updateTransactionEventFragment({ properties }, ownerId);
    }
  }, [
    updateSignatureEventFragment,
    updateTransactionEventFragment,
    ownerId,
    properties,
    currentConfirmation,
  ]);

  useEffect(() => {
    updateAlertMetrics();
  }, [updateAlertMetrics]);

  return {
    trackAlertRender,
    trackInlineAlertClicked,
    trackAlertActionClicked,
  };
}
