import { TransactionType } from '@metamask/transaction-controller';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useAlerts from '../../../hooks/useAlerts';
import { useTransactionEventFragment } from '../../../pages/confirmations/hooks/useTransactionEventFragment';
import { REDESIGN_TRANSACTION_TYPES } from '../../../pages/confirmations/utils';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { AlertsName } from '../../../pages/confirmations/hooks/alerts/constants';
import { confirmSelector } from '../../../selectors';

export type UseAlertSystemMetricsProps = {
  alertKey: string;
  action: AlertsActionMetrics;
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
  Blockaid: 'blockaid',
};

export enum AlertsActionMetrics {
  AlertVisualized = 'AlertVisualized',
  InlineAlertClicked = 'InlineAlertClicked',
  AlertActionClicked = 'AlertActionClicked',
}

export function useUpdateAlertMetrics() {
  const { currentConfirmation } = useSelector(confirmSelector);
  const ownerId = currentConfirmation?.id ?? '';
  const { alerts, isAlertConfirmed } = useAlerts(ownerId);
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const updateAlertMetrics = useCallback(() => {
    const isValidType = REDESIGN_TRANSACTION_TYPES.includes(
      currentConfirmation?.type as TransactionType,
    );

    if (!isValidType || !alerts.length) {
      return;
    }

    const confirmedAlerts = alerts.filter((alert) =>
      isAlertConfirmed(alert.key),
    );

    const properties = {
      alert_triggered: getAlertsName(alerts),
      alert_triggered_count: alerts.length,
      alert_resolved: getAlertsName(confirmedAlerts),
      alert_resolved_count: confirmedAlerts.length,
    };

    updateTransactionEventFragment({ properties }, ownerId);
  }, [
    ownerId,
    alerts,
    currentConfirmation?.type,
    isAlertConfirmed,
    updateTransactionEventFragment,
  ]);

  return { updateAlertMetrics };
}

export function useAlertSystemMetrics() {
  const { currentConfirmation } = useSelector(confirmSelector);
  const ownerId = currentConfirmation?.id ?? '';
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const { alerts, isAlertConfirmed } = useAlerts(ownerId);
  const [alertVisualized, setAlertVisualized] = useState<string[]>([]);
  const [alertKeyClicked, setAlertKeyClicked] = useState<string[]>([]);
  const [alertActionClicked, setAlertActionClicked] = useState<string[]>([]);

  const confirmedAlerts = alerts?.filter((alert) =>
    isAlertConfirmed(alert.key),
  );
  const isValidType = REDESIGN_TRANSACTION_TYPES.includes(
    currentConfirmation?.type as TransactionType,
  );

  useEffect(() => {
    if (isValidType && alerts.length > 0) {
      const properties = {
        alert_triggered: getAlertsName(alerts),
        alert_triggered_count: alerts.length,
        alert_resolved: getAlertsName(confirmedAlerts),
        alert_resolved_count: confirmedAlerts.length,
        alert_visualized: alertVisualized,
        alert_visualized_count: alertVisualized.length,
        alert_key_clicked: alertKeyClicked,
        alert_action_clicked: alertActionClicked,
      };
      updateTransactionEventFragment({ properties }, ownerId);
    }
  }, [
    alerts,
    confirmedAlerts,
    isValidType,
    ownerId,
    alertKeyClicked,
    alertActionClicked,
    alertVisualized,
  ]);

  const trackAlertMetrics = useCallback(
    ({ alertKey, action }: UseAlertSystemMetricsProps) => {
      if (!alertKey || !action || !isValidType) {
        return;
      }

      const alertName = ALERTS_NAME_METRICS[alertKey] ?? alertKey;

      switch (action) {
        case AlertsActionMetrics.AlertVisualized:
          setAlertVisualized((prev) => [...new Set([...prev, alertName])]);
          break;
        case AlertsActionMetrics.InlineAlertClicked:
          setAlertKeyClicked((prev) => [...new Set([...prev, alertName])]);
          break;
        case AlertsActionMetrics.AlertActionClicked:
          setAlertActionClicked((prev) => [...new Set([...prev, alertName])]);
          break;
        default:
      }
    },
    [isValidType, alertVisualized, alertKeyClicked, alertActionClicked],
  );

  return {
    trackAlertMetrics,
  };
}

function getAlertsName(alerts: Alert[]) {
  return alerts.map((alert) => ALERTS_NAME_METRICS[alert.key]);
}
