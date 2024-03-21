import { Severity } from '../../helpers/constants/design-system';

export type Alert = {
  key: string;
  field?: string;
  severity: Severity.Danger | Severity.Warning | Severity.Info;
  message: string;
  reason?: string;
  alertDetails?: string[];
};

export type ConfirmAlertsState = {
  alerts: { [ownerId: string]: Alert[] };
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
