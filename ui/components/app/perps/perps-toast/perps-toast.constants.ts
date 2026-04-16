export type PerpsToastVariant = 'info' | 'success' | 'error';

export const PERPS_TOAST_KEYS = {
  CANCEL_ORDER_FAILED: 'perpsToastCancelOrderFailed',
  CANCEL_ORDER_SUCCESS: 'perpsToastCancelOrderSuccess',
  CLOSE_FAILED: 'perpsToastCloseFailed',
  CLOSE_IN_PROGRESS: 'perpsToastCloseInProgress',
  MARGIN_ADD_SUCCESS: 'perpsToastMarginAddSuccess',
  MARGIN_ADJUSTMENT_FAILED: 'perpsToastMarginAdjustmentFailed',
  MARGIN_REMOVE_SUCCESS: 'perpsToastMarginRemoveSuccess',
  ORDER_FAILED: 'perpsToastOrderFailed',
  PARTIAL_CLOSE_FAILED: 'perpsToastPartialCloseFailed',
  PARTIAL_CLOSE_IN_PROGRESS: 'perpsToastPartialCloseInProgress',
  PARTIAL_CLOSE_SUCCESS: 'perpsToastPartialCloseSuccess',
  REVERSE_FAILED: 'perpsToastReverseFailed',
  REVERSE_IN_PROGRESS: 'perpsToastReverseInProgress',
  REVERSE_SUCCESS: 'perpsToastReverseSuccess',
  ORDER_FILLED: 'perpsToastOrderFilled',
  ORDER_PLACED: 'perpsToastOrderPlaced',
  ORDER_SUBMITTED: 'perpsToastOrderSubmitted',
  SUBMIT_IN_PROGRESS: 'perpsToastSubmitInProgress',
  TRADE_SUCCESS: 'perpsToastTradeSuccess',
  UPDATE_FAILED: 'perpsToastUpdateFailed',
  UPDATE_IN_PROGRESS: 'perpsToastUpdateInProgress',
  UPDATE_SUCCESS: 'perpsToastUpdateSuccess',
} as const;

export type PerpsToastKey =
  (typeof PERPS_TOAST_KEYS)[keyof typeof PERPS_TOAST_KEYS];
