import { ReactNode } from 'react';
import { SecurityProvider } from '../../../shared/constants/security-provider';
import {
  BackgroundColor,
  IconColor,
  Severity,
} from '../../helpers/constants/design-system';
import { IconName } from '../../components/component-library';

export type AlertSeverity =
  | Severity.Danger
  | Severity.Info
  | Severity.Success
  | Severity.Warning
  | Severity.Disabled;

/**
 * A confirmable alert to be displayed in the UI.
 */
export type Alert = {
  /**
   * Alternate actions the user can take, specific to the alert.
   */
  actions?: { key: string; label: string }[];

  /**
   * Additional details about the alert.
   */
  alertDetails?: string[];

  /**
   * The field associated with the alert.
   */
  field?: string;

  /**
   * Optional text to override the default on the inline alert.
   */
  inlineAlertText?: string;

  /**
   * The background color of the inline alert.
   */
  inlineAlertTextBackgroundColor?: BackgroundColor;

  /**
   * Whether to show the inline alert as a pill style.
   */
  inlineAlertTextPill?: boolean;

  /**
   * Whether to show the icon on the right side of the inline alert.
   */
  inlineAlertIconRight?: boolean;

  /**
   * The name of the icon to show.
   */
  iconName?: IconName;

  /**
   * The color of the icon to show.
   */
  iconColor?: IconColor;

  /**
   * Whether the alert is a blocker and un-acknowledgeable, preventing the user
   * from proceeding and relying on actions to proceed. The default is `false`.
   */
  isBlocking?: boolean;

  /**
   * Whether the modal is opened when the inline alert is clicked.
   */
  isOpenModalOnClick?: boolean;

  /**
   * Whether acknowledgement requirements should be bypassed for this alert,
   * even when the severity is set to Danger.
   */
  acknowledgeBypass?: boolean;

  /**
   * The unique key of the alert.
   */
  key: string;

  /**
   * The security provider associated with the alert.
   */
  provider?: SecurityProvider;

  /**
   * The reason for the alert.
   */
  reason?: string;

  /**
   * URL to report issue.
   */
  reportUrl?: string;

  /**
   * The severity of the alert.
   */
  severity: AlertSeverity;

  /**
   * Whether this alert should be excluded from navigation controls.
   */
  hideFromAlertNavigation?: boolean;

  /**
   * Whether to show the arrow icon on the inline alert.
   */
  showArrow?: boolean;

  /**
   * The background color of the alert details.
   */
  alertDetailsBackgroundColor?: BackgroundColor;

  /**
   * The custom button text for acknowledging the alert in modal.
   */
  customAcknowledgeButtonText?: string;

  /**
   * The custom button onClick handler for acknowledging the alert in modal.
   */
  customAcknowledgeButtonOnClick?: () => void;
} & MessageOrContent;

type MessageOrContent =
  | {
      /**
       * The message is a summary of the alert details.
       */
      message: string;

      /**
       * Alert summary components can be used as an alternative to a message.
       */
      content?: ReactNode;
    }
  | {
      /**
       * The message is a summary of the alert details.
       */
      message?: string;

      /**
       * Alert summary components can be used as an alternative to a message.
       */
      content: ReactNode;
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
  ownerId: string | undefined;
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
  ownerId: string | undefined;
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
  if (action.ownerId === undefined) {
    return state;
  }

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
  ownerId: string | undefined,
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

export function clearAlerts(ownerId: string | undefined): ClearAlertsAction {
  return {
    type: 'CLEAR_ALERTS',
    ownerId,
  };
}
