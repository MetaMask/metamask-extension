import { createSelector } from 'reselect';
import {
  Alert,
  ConfirmAlertsState,
} from '../ducks/confirm-alerts/confirm-alerts';

export type AlertsState = {
  confirmAlerts: ConfirmAlertsState;
};

export function selectAlerts(state: AlertsState, ownerId: string): Alert[] {
  return state.confirmAlerts.alerts[ownerId] ?? [];
}

export const selectGeneralAlerts = createSelector(
  (state: AlertsState, ownerId: string) => selectAlerts(state, ownerId),
  (alerts) => alerts.filter((alert) => !alert.field),
);

export function selectConfirmedAlertKeys(
  state: AlertsState,
  ownerId: string,
): string[] {
  const { confirmed } = state.confirmAlerts;
  const ownerConfirmed = confirmed[ownerId] || {};
  return Object.keys(ownerConfirmed).filter((key) => ownerConfirmed[key]);
}
