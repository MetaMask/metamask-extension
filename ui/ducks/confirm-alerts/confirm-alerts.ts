import { Severity } from '../../helpers/constants/design-system';

/**
 * A confirmable alert to be displayed in the UI.
 */
export type Alert = {
  /**
   * The unique key of the alert.
   */
  key: string;

  /**
   * The field associated with the alert.
   */
  field?: string;

  /**
   * The severity of the alert.
   */
  severity: Severity.Danger | Severity.Warning | Severity.Info;

  /**
   * The message is a summary of the alert details.
   */
  message: string;

  /**
   * The reason for the alert.
   */
  reason?: string;

  /**
   * Additional details about the alert.
   */
  alertDetails?: string[];
};

/**
 * Represents the state of confirm alerts in the application.
 */
export type ConfirmAlertsState = {
  /**
   * The current alerts, grouped by the ID of an abstract owner. For example, a confirmation ID.
   */
  alerts: { [ownerId: string]: Alert[] };

  /**
   * The acknowledgement status of the alerts, grouped first by alert key, then owner ID.
   * and the alert key is the nested key.
   */
  confirmed: { [ownerId: string]: { [alertKey: string]: boolean } };
};

type UpdateAlertsAction = {
  type: 'UPDATE_ALERTS';
  ownerId: string;
  alerts: Alert[];
};

type SetAlertConfirmedAction = {
  type: 'SET_ALERT_CONFIRMED';
  ownerId: string;
  alertKey: string;
  isConfirmed: boolean;
};

type ClearAlertsAction = {
  type: 'CLEAR_ALERTS';
  ownerId: string;
};

type Action = UpdateAlertsAction | SetAlertConfirmedAction | ClearAlertsAction;

const INIT_STATE: ConfirmAlertsState = {
  alerts: {},
  confirmed: {},
};

export default function confirmAlertsReducer(
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state: ConfirmAlertsState = INIT_STATE,
  action: Action,
) {
  switch (action.type) {
    case 'UPDATE_ALERTS':
      return {
        ...state,
        alerts: {
          ...state.alerts,
          [action.ownerId]: action.alerts,
        },
      };

    case 'SET_ALERT_CONFIRMED':
      return {
        ...state,
        confirmed: {
          ...state.confirmed,
          [action.ownerId]: {
            ...state.confirmed[action.ownerId],
            [action.alertKey]: action.isConfirmed,
          },
        },
      };

    case 'CLEAR_ALERTS':
      return {
        ...state,
        alerts: {
          ...state.alerts,
          [action.ownerId]: [],
        },
        confirmed: {
          ...state.confirmed,
          [action.ownerId]: {},
        },
      };

    default:
      return state;
  }
}

export function updateAlerts(
  ownerId: string,
  alerts: Alert[],
): UpdateAlertsAction {
  return {
    type: 'UPDATE_ALERTS',
    alerts,
    ownerId,
  };
}

export function setAlertConfirmed(
  ownerId: string,
  alertKey: string,
  isConfirmed: boolean,
): SetAlertConfirmedAction {
  return {
    type: 'SET_ALERT_CONFIRMED',
    ownerId,
    alertKey,
    isConfirmed,
  };
}

export function clearAlerts(ownerId: string): ClearAlertsAction {
  return {
    type: 'CLEAR_ALERTS',
    ownerId,
  };
}
