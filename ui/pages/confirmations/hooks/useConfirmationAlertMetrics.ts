import { TransactionType } from '@metamask/transaction-controller';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { validate as isUuid } from 'uuid';
import useAlerts from '../../../hooks/useAlerts';
import { REDESIGN_TRANSACTION_TYPES } from '../utils';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { confirmSelector } from '../../../selectors';
import { AlertsName } from './alerts/constants';
import { useTransactionEventFragment } from './useTransactionEventFragment';

export type UseAlertSystemMetricsProps = {
  alertKey?: string;
  action?: AlertsActionMetrics;
};

export type AlertMetricsProperties = {
  alert_visualized: string[];
  alert_visualized_count: number;
  alert_key_clicked: string[];
  alert_action_clicked: string[];
};

export const ALERTS_NAME_METRICS: Record<AlertsName | string, string> = {
  [AlertsName.GasEstimateFailed]: 'gas_estimate_failed',
  [AlertsName.GasFeeLow]: 'gas_fee_low',
  [AlertsName.GasTooLow]: 'gas_too_low',
  [AlertsName.InsufficientBalance]: 'insufficient_balance',
  [AlertsName.NetworkBusy]: 'network_busy',
  [AlertsName.NoGasPrice]: 'no_gas_price',
  [AlertsName.PendingTransaction]: 'pending_transaction',
  [AlertsName.SigningOrSubmitting]: 'signing_or_submitting',
  [AlertsName.Blockaid]: 'blockaid',
};

export enum AlertsActionMetrics {
  AlertVisualized = 'AlertVisualized',
  InlineAlertClicked = 'InlineAlertClicked',
  AlertActionClicked = 'AlertActionClicked',
}

export function useConfirmationAlertMetrics() {
  const { currentConfirmation } = useSelector(confirmSelector);
  const ownerId = currentConfirmation?.id ?? '';
  const { alerts, isAlertConfirmed } = useAlerts(ownerId);
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const [metricsProperties, setMetricsProperties] =
    useState<AlertMetricsProperties>({
      alert_visualized: [],
      alert_visualized_count: 0,
      alert_key_clicked: [],
      alert_action_clicked: [],
    });

  // Temporary measure to track metrics only for redesign transaction types
  const isValidType = REDESIGN_TRANSACTION_TYPES.includes(
    currentConfirmation?.type as TransactionType,
  );

  const trackAlertMetrics = useCallback(
    (props?: UseAlertSystemMetricsProps) => {
      const { alertKey, action } = props ?? {};
      if (!isValidType || !alertKey || !action) {
        return;
      }

      setMetricsProperties((prevState) => {
        const newState = { ...prevState };
        const alertName = isUuid(alertKey)
          ? ALERTS_NAME_METRICS[AlertsName.Blockaid]
          : ALERTS_NAME_METRICS[alertKey] ?? alertKey;

        switch (action) {
          case AlertsActionMetrics.AlertVisualized:
            newState.alert_visualized = [
              ...new Set([...prevState.alert_visualized, alertName]),
            ];
            newState.alert_visualized_count = newState.alert_visualized.length;
            break;
          case AlertsActionMetrics.InlineAlertClicked:
            newState.alert_key_clicked = [
              ...new Set([...prevState.alert_key_clicked, alertName]),
            ];
            break;
          case AlertsActionMetrics.AlertActionClicked:
            newState.alert_action_clicked = [
              ...new Set([...prevState.alert_action_clicked, alertName]),
            ];
            break;
          default:
        }
        return newState;
      });
    },
    [isValidType],
  );

  useEffect(() => {
    if (isValidType && alerts.length > 0) {
      const properties = {
        alert_triggered_count: alerts.length,
        alert_triggered: getAlertsName(alerts),
        alert_resolved_count: alerts.filter((alert) =>
          isAlertConfirmed(alert.key),
        ).length,
        alert_resolved: getAlertsName(
          alerts.filter((alert) => isAlertConfirmed(alert.key)),
        ),
        ...metricsProperties,
      };
      updateTransactionEventFragment({ properties }, ownerId);
    }
  }, [
    metricsProperties,
    alerts,
    isValidType,
    ownerId,
    updateTransactionEventFragment,
  ]);

  return { trackAlertMetrics };
}

function getAlertsName(alerts: Alert[]): string[] {
  return alerts.map((alert) => {
    if (isUuid(alert.key)) {
      return ALERTS_NAME_METRICS[AlertsName.Blockaid];
    }
    return ALERTS_NAME_METRICS[alert.key] ?? alert.key;
  });
}
