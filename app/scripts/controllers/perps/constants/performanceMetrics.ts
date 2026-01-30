/**
 * Performance measurement names for Sentry monitoring.
 * These constants ensure consistency across the Perps feature.
 * Used for direct setMeasurement() calls in controllers and services.
 *
 * Naming Convention: perps.{category}.{metric_name}
 * - Uses dot notation for hierarchical grouping in Sentry
 * - Categories: websocket, connection, api, operation, screen, ui
 * - Enables easy filtering (e.g., perps.websocket.*) and dashboard aggregation
 */
export enum PerpsMeasurementName {
  // ===== ACTIVE SENTRY METRICS =====

  // WebSocket Performance Metrics (milliseconds)
  PerpsWebsocketConnectionEstablishment = 'perps.websocket.connection_establishment',
  PerpsWebsocketConnectionWithPreload = 'perps.websocket.connection_with_preload',
  PerpsWebsocketFirstPositionData = 'perps.websocket.first_position_data',
  PerpsWebsocketAccountSwitchReconnection = 'perps.websocket.account_switch_reconnection',
  PerpsConnectionHealthCheck = 'perps.websocket.health_check',
  PerpsReconnectionHealthCheck = 'perps.websocket.reconnection_health_check',

  // Connection Lifecycle Metrics (milliseconds)
  PerpsProviderInit = 'perps.connection.provider_init',
  PerpsAccountStateFetch = 'perps.connection.account_state_fetch',
  PerpsSubscriptionsPreload = 'perps.connection.subscriptions_preload',
  PerpsReconnectionCleanup = 'perps.connection.cleanup',
  PerpsControllerReinit = 'perps.connection.controller_reinit',
  PerpsNewAccountFetch = 'perps.connection.new_account_fetch',
  PerpsReconnectionPreload = 'perps.connection.reconnection_preload',

  // API Call Metrics (milliseconds)
  PerpsDataLakeApiCall = 'perps.api.data_lake_call',
  PerpsRewardsFeeDiscountApiCall = 'perps.api.rewards_fee_discount',
  PerpsRewardsPointsEstimationApiCall = 'perps.api.rewards_points_estimation',
  PerpsRewardsOrderExecutionFeeDiscountApiCall = 'perps.api.rewards_order_execution_fee_discount',

  // Data Operation Metrics (milliseconds)
  PerpsGetPositionsOperation = 'perps.operation.get_positions',
  PerpsGetOpenOrdersOperation = 'perps.operation.get_open_orders',

  // Screen Load Metrics (milliseconds)
  PerpsWithdrawalScreenLoaded = 'perps.screen.withdrawal_loaded',
  PerpsMarketsScreenLoaded = 'perps.screen.markets_loaded',
  PerpsAssetScreenLoaded = 'perps.screen.asset_loaded',
  PerpsTradeScreenLoaded = 'perps.screen.trade_loaded',
  PerpsCloseScreenLoaded = 'perps.screen.close_loaded',
  PerpsTransactionHistoryScreenLoaded = 'perps.screen.transaction_history_loaded',
  PerpsTabLoaded = 'perps.screen.tab_loaded',

  // UI Component Metrics (milliseconds)
  PerpsLeverageBottomSheetLoaded = 'perps.ui.leverage_bottom_sheet_loaded',
  PerpsOrderSubmissionToastLoaded = 'perps.ui.order_submission_toast_loaded',
  PerpsOrderConfirmationToastLoaded = 'perps.ui.order_confirmation_toast_loaded',
  PerpsCloseOrderSubmissionToastLoaded = 'perps.ui.close_order_submission_toast_loaded',
  PerpsCloseOrderConfirmationToastLoaded = 'perps.ui.close_order_confirmation_toast_loaded',
}
