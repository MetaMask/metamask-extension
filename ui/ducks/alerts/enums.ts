export const ALERT_STATE = {
  CLOSED: 'CLOSED',
  ERROR: 'ERROR',
  LOADING: 'LOADING',
  OPEN: 'OPEN',
} as const;

export type AlertState = (typeof ALERT_STATE)[keyof typeof ALERT_STATE];
