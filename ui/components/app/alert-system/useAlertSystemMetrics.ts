import { TransactionType } from '@metamask/transaction-controller';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import useAlerts from '../../../hooks/useAlerts';
import { useTransactionEventFragment } from '../../../pages/confirmations/hooks/useTransactionEventFragment';
import { REDESIGN_TRANSACTION_TYPES } from '../../../pages/confirmations/utils';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { AlertsName } from '../../../pages/confirmations/hooks/alerts/constants';
import { confirmSelector } from '../../../selectors';

export type UseAlertSystemMetricsProps = {
  ownerId: string;
  alertKey?: string;
  action?: AlertsActionMetrics;
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

export function updateAlertMetrics({
  ownerId,
  alertKey,
  action,
}: UseAlertSystemMetricsProps) {
  const { currentConfirmation } = useSelector(confirmSelector);
  const { alerts, isAlertConfirmed } = useAlerts(ownerId);
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const [alertVisualized, setAlertVisualized] = useState<string[]>([]);
  const [alertKeyClicked, setAlertKeyClicked] = useState<string[]>([]);
  const [alertActionClicked, setAlertActionClicked] = useState<string[]>([]);

  // Temporary validation to avoid sending metrics for supported types
  const isValidType = REDESIGN_TRANSACTION_TYPES.includes(
    currentConfirmation?.type as TransactionType,
  );

  const confirmedAlerts = alerts?.filter((alert) =>
    isAlertConfirmed(alert.key),
  );

  useEffect(() => {
    console.log('updateAlertMetrics >>>', alertKey, action);
    if (alertKey && action) {
      const alertName = ALERTS_NAME_METRICS[alertKey] ?? alertKey;

      switch (action) {
        case AlertsActionMetrics.AlertVisualized:
          setAlertVisualized((prev) => [...prev, alertName]);
          break;
        case AlertsActionMetrics.InlineAlertClicked:
          setAlertKeyClicked((prev) => [...prev, alertName]);
          break;
        case AlertsActionMetrics.AlertActionClicked:
          setAlertActionClicked((prev) => [...prev, alertName]);
          break;
        default:
          break;
      }
    }
  }, [alertKey, action]);

  const properties = useMemo(
    () => ({
      alert_triggered_count: alerts.length,
      alert_triggered: getAlertsName(alerts),
      alert_visualized_count: alertVisualized.length,
      alert_visualized: alertVisualized,
      alert_key_clicked: alertKeyClicked,
      alert_action_clicked: alertActionClicked,
      alert_resolved_count: confirmedAlerts.length,
      alert_resolved: getAlertsName(confirmedAlerts),
    }),
    [
      alerts,
      alertVisualized,
      alertKeyClicked,
      alertActionClicked,
      confirmedAlerts,
    ],
  );

  useEffect(() => {
    if (isValidType && alerts.length > 0) {
      updateTransactionEventFragment({ properties }, ownerId);
      console.log('updateTransactionEventFragment >>>', properties, ownerId);
    }
  }, [updateTransactionEventFragment, ownerId, properties]);
}

export function useAlertSystemMetrics({
  ownerId,
  alertKey,
  action,
}: UseAlertSystemMetricsProps) {
  updateAlertMetrics({ ownerId, alertKey, action });
}

function getAlertsName(alerts: Alert[]) {
  return alerts.map((alert) => ALERTS_NAME_METRICS[alert.key]);
}
