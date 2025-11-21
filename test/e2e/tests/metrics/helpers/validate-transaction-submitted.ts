/**
 * Auto-generated validator for "Transaction Submitted" event
 * Generated from Segment schema
 * 
 * Schema version: 3af2b9e (main)
 * Generated at: 2025-11-21T18:24:27.066Z
 * 
 * To regenerate this file, run:
 * yarn tsx development/segment-event-parser.ts \
 *   --event "Transaction Submitted" \
 *   --destination ./test/e2e/tests/metrics/helpers
 * 
 * To update schema version:
 * yarn tsx development/segment-event-parser.ts \
 *   --event "Transaction Submitted" \
 *   --destination ./test/e2e/tests/metrics/helpers \
 *   --update-schema
 */

type EventPayload = {
  event: string;
  messageId: string;
  userId?: string;
  anonymousId?: string;
  properties: Record<string, unknown>;
  context?: Record<string, unknown>;
  timestamp?: string;
  type?: string;
};

type AssertionFunction = (event: EventPayload, errors?: string[]) => void;

/**
 * Validates a "Transaction Submitted" event payload
 * @param event - The event payload to validate (full event object with properties nested)
 * @param assertFn - Optional assertion function(s) to handle validation.
 *                   Can be a single function or array of functions.
 *                   Each function receives the event payload and optional array of validation errors.
 *                   If not provided, throws Error if there are validation errors.
 */
export function validateTransactionSubmitted(
  event: EventPayload,
  assertFn?: AssertionFunction | AssertionFunction[]
): void {
  const errors: string[] = [];

  // Check required properties
  if (event.properties.chain_id === undefined || event.properties.chain_id === null) {
    errors.push('Required property "chain_id" is missing');
  }
  if (event.properties.account_type === undefined || event.properties.account_type === null) {
    errors.push('Required property "account_type" is missing');
  }
  if (event.properties.transaction_type === undefined || event.properties.transaction_type === null) {
    errors.push('Required property "transaction_type" is missing');
  }

  // Validate property types
  // chain_id (required)
  if (event.properties.chain_id !== undefined && event.properties.chain_id !== null) {
    if (!(typeof event.properties.chain_id === 'string')) {
      errors.push('Property "chain_id" has invalid type. Expected: string');
    }
  }

  // environment_type (optional)
  if (event.properties.environment_type !== undefined && event.properties.environment_type !== null) {
    if (!(typeof event.properties.environment_type === 'string')) {
      errors.push('Property "environment_type" has invalid type. Expected: string');
    }
  }

  // locale (optional)
  if (event.properties.locale !== undefined && event.properties.locale !== null) {
    if (!(typeof event.properties.locale === 'string')) {
      errors.push('Property "locale" has invalid type. Expected: string');
    }
  }

  // network (optional)
  if (event.properties.network !== undefined && event.properties.network !== null) {
    if (!(typeof event.properties.network === 'string')) {
      errors.push('Property "network" has invalid type. Expected: string');
    }
  }

  // account_hardware_type (optional)
  if (event.properties.account_hardware_type !== undefined && event.properties.account_hardware_type !== null) {
    if (!(typeof event.properties.account_hardware_type === 'string')) {
      errors.push('Property "account_hardware_type" has invalid type. Expected: string');
    }
  }

  // account_hardware_version (optional)
  if (event.properties.account_hardware_version !== undefined && event.properties.account_hardware_version !== null) {
    if (!(typeof event.properties.account_hardware_version === 'string')) {
      errors.push('Property "account_hardware_version" has invalid type. Expected: string');
    }
  }

  // account_import_type (optional)
  if (event.properties.account_import_type !== undefined && event.properties.account_import_type !== null) {
    if (!(typeof event.properties.account_import_type === 'string')) {
      errors.push('Property "account_import_type" has invalid type. Expected: string');
    }
  }

  // account_snap_type (optional)
  if (event.properties.account_snap_type !== undefined && event.properties.account_snap_type !== null) {
    if (!(typeof event.properties.account_snap_type === 'string')) {
      errors.push('Property "account_snap_type" has invalid type. Expected: string');
    }
  }

  // account_snap_version (optional)
  if (event.properties.account_snap_version !== undefined && event.properties.account_snap_version !== null) {
    if (!(typeof event.properties.account_snap_version === 'string')) {
      errors.push('Property "account_snap_version" has invalid type. Expected: string');
    }
  }

  // account_type (required)
  if (event.properties.account_type !== undefined && event.properties.account_type !== null) {
    if (!(typeof event.properties.account_type === 'string')) {
      errors.push('Property "account_type" has invalid type. Expected: string');
    }
  }

  // device_model (optional)
  if (event.properties.device_model !== undefined && event.properties.device_model !== null) {
    if (!(typeof event.properties.device_model === 'string')) {
      errors.push('Property "device_model" has invalid type. Expected: string');
    }
  }

  // asset_type (optional)
  if (event.properties.asset_type !== undefined && event.properties.asset_type !== null) {
    if (!(typeof event.properties.asset_type === 'string')) {
      errors.push('Property "asset_type" has invalid type. Expected: string');
    }
  }

  // chain_id_caip (optional)
  if (event.properties.chain_id_caip !== undefined && event.properties.chain_id_caip !== null) {
    if (!(typeof event.properties.chain_id_caip === 'string')) {
      errors.push('Property "chain_id_caip" has invalid type. Expected: string');
    }
  }

  // eip_1559_version (optional)
  if (event.properties.eip_1559_version !== undefined && event.properties.eip_1559_version !== null) {
    if (!(typeof event.properties.eip_1559_version === 'string')) {
      errors.push('Property "eip_1559_version" has invalid type. Expected: string');
    }
  }

  // gas_edit_attempted (optional)
  if (event.properties.gas_edit_attempted !== undefined && event.properties.gas_edit_attempted !== null) {
    if (!(typeof event.properties.gas_edit_attempted === 'string')) {
      errors.push('Property "gas_edit_attempted" has invalid type. Expected: string');
    }
  }

  // gas_edit_type (optional)
  if (event.properties.gas_edit_type !== undefined && event.properties.gas_edit_type !== null) {
    if (!(typeof event.properties.gas_edit_type === 'string')) {
      errors.push('Property "gas_edit_type" has invalid type. Expected: string');
    }
  }

  // source (optional)
  if (event.properties.source !== undefined && event.properties.source !== null) {
    if (!(typeof event.properties.source === 'string')) {
      errors.push('Property "source" has invalid type. Expected: string');
    }
  }

  // transaction_speed_up (optional)
  if (event.properties.transaction_speed_up !== undefined && event.properties.transaction_speed_up !== null) {
    if (!(typeof event.properties.transaction_speed_up === 'boolean')) {
      errors.push('Property "transaction_speed_up" has invalid type. Expected: boolean');
    }
  }

  // transaction_type (required)
  if (event.properties.transaction_type !== undefined && event.properties.transaction_type !== null) {
    if (!(typeof event.properties.transaction_type === 'string')) {
      errors.push('Property "transaction_type" has invalid type. Expected: string');
    }
  }

  // status (optional)
  if (event.properties.status !== undefined && event.properties.status !== null) {
    if (!(typeof event.properties.status === 'string')) {
      errors.push('Property "status" has invalid type. Expected: string');
    }
  }

  // gas_estimation_failed (optional)
  if (event.properties.gas_estimation_failed !== undefined && event.properties.gas_estimation_failed !== null) {
    if (!(typeof event.properties.gas_estimation_failed === 'boolean')) {
      errors.push('Property "gas_estimation_failed" has invalid type. Expected: boolean');
    }
  }

  // error (optional)
  if (event.properties.error !== undefined && event.properties.error !== null) {
    if (!(typeof event.properties.error === 'string')) {
      errors.push('Property "error" has invalid type. Expected: string');
    }
  }

  // transaction_contract_method (optional)
  if (event.properties.transaction_contract_method !== undefined && event.properties.transaction_contract_method !== null) {
    if (!(Array.isArray(event.properties.transaction_contract_method))) {
      errors.push('Property "transaction_contract_method" has invalid type. Expected: array');
    }
  }

  // is_smart_transaction (optional)
  if (event.properties.is_smart_transaction !== undefined && event.properties.is_smart_transaction !== null) {
    if (!(typeof event.properties.is_smart_transaction === 'boolean')) {
      errors.push('Property "is_smart_transaction" has invalid type. Expected: boolean');
    }
  }

  // simulation_response (optional)
  if (event.properties.simulation_response !== undefined && event.properties.simulation_response !== null) {
    if (!(typeof event.properties.simulation_response === 'string')) {
      errors.push('Property "simulation_response" has invalid type. Expected: string');
    }
  }

  // simulation_latency (optional)
  if (event.properties.simulation_latency !== undefined && event.properties.simulation_latency !== null) {
    if (!(typeof event.properties.simulation_latency === 'number')) {
      errors.push('Property "simulation_latency" has invalid type. Expected: number');
    }
  }

  // simulation_receiving_assets_petname (optional)
  if (event.properties.simulation_receiving_assets_petname !== undefined && event.properties.simulation_receiving_assets_petname !== null) {
    if (!(Array.isArray(event.properties.simulation_receiving_assets_petname))) {
      errors.push('Property "simulation_receiving_assets_petname" has invalid type. Expected: array');
    }
  }

  // simulation_receiving_assets_quantity (optional)
  if (event.properties.simulation_receiving_assets_quantity !== undefined && event.properties.simulation_receiving_assets_quantity !== null) {
    if (!(typeof event.properties.simulation_receiving_assets_quantity === 'number')) {
      errors.push('Property "simulation_receiving_assets_quantity" has invalid type. Expected: number');
    }
  }

  // simulation_receiving_assets_type (optional)
  if (event.properties.simulation_receiving_assets_type !== undefined && event.properties.simulation_receiving_assets_type !== null) {
    if (!(Array.isArray(event.properties.simulation_receiving_assets_type))) {
      errors.push('Property "simulation_receiving_assets_type" has invalid type. Expected: array');
    }
  }

  // simulation_receiving_assets_value (optional)
  if (event.properties.simulation_receiving_assets_value !== undefined && event.properties.simulation_receiving_assets_value !== null) {
    if (!(Array.isArray(event.properties.simulation_receiving_assets_value))) {
      errors.push('Property "simulation_receiving_assets_value" has invalid type. Expected: array');
    }
  }

  // simulation_sending_assets_petname (optional)
  if (event.properties.simulation_sending_assets_petname !== undefined && event.properties.simulation_sending_assets_petname !== null) {
    if (!(Array.isArray(event.properties.simulation_sending_assets_petname))) {
      errors.push('Property "simulation_sending_assets_petname" has invalid type. Expected: array');
    }
  }

  // simulation_sending_assets_quantity (optional)
  if (event.properties.simulation_sending_assets_quantity !== undefined && event.properties.simulation_sending_assets_quantity !== null) {
    if (!(typeof event.properties.simulation_sending_assets_quantity === 'number')) {
      errors.push('Property "simulation_sending_assets_quantity" has invalid type. Expected: number');
    }
  }

  // simulation_sending_assets_type (optional)
  if (event.properties.simulation_sending_assets_type !== undefined && event.properties.simulation_sending_assets_type !== null) {
    if (!(Array.isArray(event.properties.simulation_sending_assets_type))) {
      errors.push('Property "simulation_sending_assets_type" has invalid type. Expected: array');
    }
  }

  // simulation_sending_assets_value (optional)
  if (event.properties.simulation_sending_assets_value !== undefined && event.properties.simulation_sending_assets_value !== null) {
    if (!(Array.isArray(event.properties.simulation_sending_assets_value))) {
      errors.push('Property "simulation_sending_assets_value" has invalid type. Expected: array');
    }
  }

  // simulation_sending_assets_total_value (optional)
  if (event.properties.simulation_sending_assets_total_value !== undefined && event.properties.simulation_sending_assets_total_value !== null) {
    if (!(typeof event.properties.simulation_sending_assets_total_value === 'number')) {
      errors.push('Property "simulation_sending_assets_total_value" has invalid type. Expected: number');
    }
  }

  // simulation_receiving_assets_total_value (optional)
  if (event.properties.simulation_receiving_assets_total_value !== undefined && event.properties.simulation_receiving_assets_total_value !== null) {
    if (!(typeof event.properties.simulation_receiving_assets_total_value === 'number')) {
      errors.push('Property "simulation_receiving_assets_total_value" has invalid type. Expected: number');
    }
  }

  // alert_triggered_count (optional)
  if (event.properties.alert_triggered_count !== undefined && event.properties.alert_triggered_count !== null) {
    if (!(typeof event.properties.alert_triggered_count === 'number')) {
      errors.push('Property "alert_triggered_count" has invalid type. Expected: number');
    }
  }

  // alert_triggered (optional)
  if (event.properties.alert_triggered !== undefined && event.properties.alert_triggered !== null) {
    if (!(Array.isArray(event.properties.alert_triggered))) {
      errors.push('Property "alert_triggered" has invalid type. Expected: array');
    }
  }

  // alert_trigger_name (optional)
  if (event.properties.alert_trigger_name !== undefined && event.properties.alert_trigger_name !== null) {
    if (!(Array.isArray(event.properties.alert_trigger_name))) {
      errors.push('Property "alert_trigger_name" has invalid type. Expected: array');
    }
  }

  // alert_visualized_count (optional)
  if (event.properties.alert_visualized_count !== undefined && event.properties.alert_visualized_count !== null) {
    if (!(typeof event.properties.alert_visualized_count === 'number')) {
      errors.push('Property "alert_visualized_count" has invalid type. Expected: number');
    }
  }

  // alert_visualized (optional)
  if (event.properties.alert_visualized !== undefined && event.properties.alert_visualized !== null) {
    if (!(Array.isArray(event.properties.alert_visualized))) {
      errors.push('Property "alert_visualized" has invalid type. Expected: array');
    }
  }

  // alert_resolved_count (optional)
  if (event.properties.alert_resolved_count !== undefined && event.properties.alert_resolved_count !== null) {
    if (!(typeof event.properties.alert_resolved_count === 'number')) {
      errors.push('Property "alert_resolved_count" has invalid type. Expected: number');
    }
  }

  // alert_resolved (optional)
  if (event.properties.alert_resolved !== undefined && event.properties.alert_resolved !== null) {
    if (!(Array.isArray(event.properties.alert_resolved))) {
      errors.push('Property "alert_resolved" has invalid type. Expected: array');
    }
  }

  // alert_key_clicked (optional)
  if (event.properties.alert_key_clicked !== undefined && event.properties.alert_key_clicked !== null) {
    if (!(Array.isArray(event.properties.alert_key_clicked))) {
      errors.push('Property "alert_key_clicked" has invalid type. Expected: array');
    }
  }

  // alert_action_clicked (optional)
  if (event.properties.alert_action_clicked !== undefined && event.properties.alert_action_clicked !== null) {
    if (!(Array.isArray(event.properties.alert_action_clicked))) {
      errors.push('Property "alert_action_clicked" has invalid type. Expected: array');
    }
  }

  // gas_insufficient_native_asset (optional)
  if (event.properties.gas_insufficient_native_asset !== undefined && event.properties.gas_insufficient_native_asset !== null) {
    if (!(typeof event.properties.gas_insufficient_native_asset === 'boolean')) {
      errors.push('Property "gas_insufficient_native_asset" has invalid type. Expected: boolean');
    }
  }

  // gas_payment_tokens_available (optional)
  if (event.properties.gas_payment_tokens_available !== undefined && event.properties.gas_payment_tokens_available !== null) {
    if (!(Array.isArray(event.properties.gas_payment_tokens_available))) {
      errors.push('Property "gas_payment_tokens_available" has invalid type. Expected: array');
    }
  }

  // gas_paid_with (optional)
  if (event.properties.gas_paid_with !== undefined && event.properties.gas_paid_with !== null) {
    if (!(typeof event.properties.gas_paid_with === 'string')) {
      errors.push('Property "gas_paid_with" has invalid type. Expected: string');
    }
  }

  // api_method (optional)
  if (event.properties.api_method !== undefined && event.properties.api_method !== null) {
    if (!(typeof event.properties.api_method === 'string')) {
      errors.push('Property "api_method" has invalid type. Expected: string');
    }
  }

  // batch_transaction_count (optional)
  if (event.properties.batch_transaction_count !== undefined && event.properties.batch_transaction_count !== null) {
    if (!(typeof event.properties.batch_transaction_count === 'number')) {
      errors.push('Property "batch_transaction_count" has invalid type. Expected: integer');
    }
  }

  // batch_transaction_method (optional)
  if (event.properties.batch_transaction_method !== undefined && event.properties.batch_transaction_method !== null) {
    if (!(typeof event.properties.batch_transaction_method === 'string')) {
      errors.push('Property "batch_transaction_method" has invalid type. Expected: string');
    }
  }

  // eip7702_upgrade_transaction (optional)
  if (event.properties.eip7702_upgrade_transaction !== undefined && event.properties.eip7702_upgrade_transaction !== null) {
    if (!(typeof event.properties.eip7702_upgrade_transaction === 'boolean')) {
      errors.push('Property "eip7702_upgrade_transaction" has invalid type. Expected: boolean');
    }
  }

  // account_eip7702_upgraded (optional)
  if (event.properties.account_eip7702_upgraded !== undefined && event.properties.account_eip7702_upgraded !== null) {
    if (!(typeof event.properties.account_eip7702_upgraded === 'string')) {
      errors.push('Property "account_eip7702_upgraded" has invalid type. Expected: string');
    }
  }

  // eip7702_upgrade_rejection (optional)
  if (event.properties.eip7702_upgrade_rejection !== undefined && event.properties.eip7702_upgrade_rejection !== null) {
    if (!(typeof event.properties.eip7702_upgrade_rejection === 'boolean')) {
      errors.push('Property "eip7702_upgrade_rejection" has invalid type. Expected: boolean');
    }
  }

  // mm_pay (optional)
  if (event.properties.mm_pay !== undefined && event.properties.mm_pay !== null) {
    if (!(typeof event.properties.mm_pay === 'boolean')) {
      errors.push('Property "mm_pay" has invalid type. Expected: boolean');
    }
  }

  // mm_pay_use_case (optional)
  if (event.properties.mm_pay_use_case !== undefined && event.properties.mm_pay_use_case !== null) {
    if (!(typeof event.properties.mm_pay_use_case === 'string')) {
      errors.push('Property "mm_pay_use_case" has invalid type. Expected: string');
    }
  }

  // mm_pay_token_presented (optional)
  if (event.properties.mm_pay_token_presented !== undefined && event.properties.mm_pay_token_presented !== null) {
    if (!(typeof event.properties.mm_pay_token_presented === 'string')) {
      errors.push('Property "mm_pay_token_presented" has invalid type. Expected: string');
    }
  }

  // mm_pay_chain_presented (optional)
  if (event.properties.mm_pay_chain_presented !== undefined && event.properties.mm_pay_chain_presented !== null) {
    if (!(typeof event.properties.mm_pay_chain_presented === 'string')) {
      errors.push('Property "mm_pay_chain_presented" has invalid type. Expected: string');
    }
  }

  // mm_pay_token_selected (optional)
  if (event.properties.mm_pay_token_selected !== undefined && event.properties.mm_pay_token_selected !== null) {
    if (!(typeof event.properties.mm_pay_token_selected === 'string')) {
      errors.push('Property "mm_pay_token_selected" has invalid type. Expected: string');
    }
  }

  // mm_pay_chain_selected (optional)
  if (event.properties.mm_pay_chain_selected !== undefined && event.properties.mm_pay_chain_selected !== null) {
    if (!(typeof event.properties.mm_pay_chain_selected === 'string')) {
      errors.push('Property "mm_pay_chain_selected" has invalid type. Expected: string');
    }
  }

  // mm_pay_payment_token_list_size (optional)
  if (event.properties.mm_pay_payment_token_list_size !== undefined && event.properties.mm_pay_payment_token_list_size !== null) {
    if (!(typeof event.properties.mm_pay_payment_token_list_size === 'number')) {
      errors.push('Property "mm_pay_payment_token_list_size" has invalid type. Expected: integer');
    }
  }

  // mm_pay_quotes_latency (optional)
  if (event.properties.mm_pay_quotes_latency !== undefined && event.properties.mm_pay_quotes_latency !== null) {
    if (!(typeof event.properties.mm_pay_quotes_latency === 'number')) {
      errors.push('Property "mm_pay_quotes_latency" has invalid type. Expected: integer');
    }
  }

  // mm_pay_quotes_attempts (optional)
  if (event.properties.mm_pay_quotes_attempts !== undefined && event.properties.mm_pay_quotes_attempts !== null) {
    if (!(typeof event.properties.mm_pay_quotes_attempts === 'number')) {
      errors.push('Property "mm_pay_quotes_attempts" has invalid type. Expected: integer');
    }
  }

  // mm_pay_buffer_size (optional)
  if (event.properties.mm_pay_buffer_size !== undefined && event.properties.mm_pay_buffer_size !== null) {
    if (!(typeof event.properties.mm_pay_buffer_size === 'number')) {
      errors.push('Property "mm_pay_buffer_size" has invalid type. Expected: integer');
    }
  }

  // mm_pay_transaction_step (optional)
  if (event.properties.mm_pay_transaction_step !== undefined && event.properties.mm_pay_transaction_step !== null) {
    if (!(typeof event.properties.mm_pay_transaction_step === 'number')) {
      errors.push('Property "mm_pay_transaction_step" has invalid type. Expected: integer');
    }
  }

  // mm_pay_transaction_step_total (optional)
  if (event.properties.mm_pay_transaction_step_total !== undefined && event.properties.mm_pay_transaction_step_total !== null) {
    if (!(typeof event.properties.mm_pay_transaction_step_total === 'number')) {
      errors.push('Property "mm_pay_transaction_step_total" has invalid type. Expected: integer');
    }
  }

  // mm_pay_dust_usd (optional)
  if (event.properties.mm_pay_dust_usd !== undefined && event.properties.mm_pay_dust_usd !== null) {
    if (!(typeof event.properties.mm_pay_dust_usd === 'number')) {
      errors.push('Property "mm_pay_dust_usd" has invalid type. Expected: integer');
    }
  }

  // mm_pay_bridge_provider (optional)
  if (event.properties.mm_pay_bridge_provider !== undefined && event.properties.mm_pay_bridge_provider !== null) {
    if (!(typeof event.properties.mm_pay_bridge_provider === 'string')) {
      errors.push('Property "mm_pay_bridge_provider" has invalid type. Expected: string');
    }
  }

  // polymarket_account_created (optional)
  if (event.properties.polymarket_account_created !== undefined && event.properties.polymarket_account_created !== null) {
    if (!(typeof event.properties.polymarket_account_created === 'boolean')) {
      errors.push('Property "polymarket_account_created" has invalid type. Expected: boolean');
    }
  }

  // swap_dapp_comparison (optional)
  if (event.properties.swap_dapp_comparison !== undefined && event.properties.swap_dapp_comparison !== null) {
    if (!(typeof event.properties.swap_dapp_comparison === 'string')) {
      errors.push('Property "swap_dapp_comparison" has invalid type. Expected: string');
    }
  }

  // swap_mm_displayed (optional)
  if (event.properties.swap_mm_displayed !== undefined && event.properties.swap_mm_displayed !== null) {
    if (!(typeof event.properties.swap_mm_displayed === 'boolean')) {
      errors.push('Property "swap_mm_displayed" has invalid type. Expected: boolean');
    }
  }

  // swap_selected (optional)
  if (event.properties.swap_selected !== undefined && event.properties.swap_selected !== null) {
    if (!(typeof event.properties.swap_selected === 'string')) {
      errors.push('Property "swap_selected" has invalid type. Expected: string');
    }
  }

  // swap_dapp_from_token_simulated_value_usd (optional)
  if (event.properties.swap_dapp_from_token_simulated_value_usd !== undefined && event.properties.swap_dapp_from_token_simulated_value_usd !== null) {
    if (!(typeof event.properties.swap_dapp_from_token_simulated_value_usd === 'number')) {
      errors.push('Property "swap_dapp_from_token_simulated_value_usd" has invalid type. Expected: number');
    }
  }

  // swap_dapp_to_token_simulated_value_usd (optional)
  if (event.properties.swap_dapp_to_token_simulated_value_usd !== undefined && event.properties.swap_dapp_to_token_simulated_value_usd !== null) {
    if (!(typeof event.properties.swap_dapp_to_token_simulated_value_usd === 'number')) {
      errors.push('Property "swap_dapp_to_token_simulated_value_usd" has invalid type. Expected: number');
    }
  }

  // swap_dapp_minimum_received_value_usd (optional)
  if (event.properties.swap_dapp_minimum_received_value_usd !== undefined && event.properties.swap_dapp_minimum_received_value_usd !== null) {
    if (!(typeof event.properties.swap_dapp_minimum_received_value_usd === 'number')) {
      errors.push('Property "swap_dapp_minimum_received_value_usd" has invalid type. Expected: number');
    }
  }

  // swap_dapp_network_fee_usd (optional)
  if (event.properties.swap_dapp_network_fee_usd !== undefined && event.properties.swap_dapp_network_fee_usd !== null) {
    if (!(typeof event.properties.swap_dapp_network_fee_usd === 'number')) {
      errors.push('Property "swap_dapp_network_fee_usd" has invalid type. Expected: number');
    }
  }

  // swap_dapp_commands (optional)
  if (event.properties.swap_dapp_commands !== undefined && event.properties.swap_dapp_commands !== null) {
    if (!(typeof event.properties.swap_dapp_commands === 'string')) {
      errors.push('Property "swap_dapp_commands" has invalid type. Expected: string');
    }
  }

  // swap_mm_from_token_simulated_value_usd (optional)
  if (event.properties.swap_mm_from_token_simulated_value_usd !== undefined && event.properties.swap_mm_from_token_simulated_value_usd !== null) {
    if (!(typeof event.properties.swap_mm_from_token_simulated_value_usd === 'number')) {
      errors.push('Property "swap_mm_from_token_simulated_value_usd" has invalid type. Expected: number');
    }
  }

  // swap_mm_to_token_simulated_value_usd (optional)
  if (event.properties.swap_mm_to_token_simulated_value_usd !== undefined && event.properties.swap_mm_to_token_simulated_value_usd !== null) {
    if (!(typeof event.properties.swap_mm_to_token_simulated_value_usd === 'number')) {
      errors.push('Property "swap_mm_to_token_simulated_value_usd" has invalid type. Expected: number');
    }
  }

  // swap_mm_minimum_received_value_usd (optional)
  if (event.properties.swap_mm_minimum_received_value_usd !== undefined && event.properties.swap_mm_minimum_received_value_usd !== null) {
    if (!(typeof event.properties.swap_mm_minimum_received_value_usd === 'number')) {
      errors.push('Property "swap_mm_minimum_received_value_usd" has invalid type. Expected: number');
    }
  }

  // swap_mm_network_fee_usd (optional)
  if (event.properties.swap_mm_network_fee_usd !== undefined && event.properties.swap_mm_network_fee_usd !== null) {
    if (!(typeof event.properties.swap_mm_network_fee_usd === 'number')) {
      errors.push('Property "swap_mm_network_fee_usd" has invalid type. Expected: number');
    }
  }

  // swap_mm_slippage (optional)
  if (event.properties.swap_mm_slippage !== undefined && event.properties.swap_mm_slippage !== null) {
    if (!(typeof event.properties.swap_mm_slippage === 'number')) {
      errors.push('Property "swap_mm_slippage" has invalid type. Expected: number');
    }
  }

  // swap_mm_quote_provider (optional)
  if (event.properties.swap_mm_quote_provider !== undefined && event.properties.swap_mm_quote_provider !== null) {
    if (!(typeof event.properties.swap_mm_quote_provider === 'string')) {
      errors.push('Property "swap_mm_quote_provider" has invalid type. Expected: string');
    }
  }

  // swap_dapp_request_detection_latency_ms (optional)
  if (event.properties.swap_dapp_request_detection_latency_ms !== undefined && event.properties.swap_dapp_request_detection_latency_ms !== null) {
    if (!(typeof event.properties.swap_dapp_request_detection_latency_ms === 'number')) {
      errors.push('Property "swap_dapp_request_detection_latency_ms" has invalid type. Expected: integer');
    }
  }

  // swap_mm_quote_request_latency_ms (optional)
  if (event.properties.swap_mm_quote_request_latency_ms !== undefined && event.properties.swap_mm_quote_request_latency_ms !== null) {
    if (!(typeof event.properties.swap_mm_quote_request_latency_ms === 'number')) {
      errors.push('Property "swap_mm_quote_request_latency_ms" has invalid type. Expected: integer');
    }
  }

  // swap_mm_quote_response_latency_ms (optional)
  if (event.properties.swap_mm_quote_response_latency_ms !== undefined && event.properties.swap_mm_quote_response_latency_ms !== null) {
    if (!(typeof event.properties.swap_mm_quote_response_latency_ms === 'number')) {
      errors.push('Property "swap_mm_quote_response_latency_ms" has invalid type. Expected: integer');
    }
  }

  // swap_comparison_total_latency_ms (optional)
  if (event.properties.swap_comparison_total_latency_ms !== undefined && event.properties.swap_comparison_total_latency_ms !== null) {
    if (!(typeof event.properties.swap_comparison_total_latency_ms === 'number')) {
      errors.push('Property "swap_comparison_total_latency_ms" has invalid type. Expected: integer');
    }
  }

  // ui_customizations (optional)
  if (event.properties.ui_customizations !== undefined && event.properties.ui_customizations !== null) {
    if (!(Array.isArray(event.properties.ui_customizations))) {
      errors.push('Property "ui_customizations" has invalid type. Expected: array');
    }
  }

  // security_alert_response (optional)
  if (event.properties.security_alert_response !== undefined && event.properties.security_alert_response !== null) {
    if (!(typeof event.properties.security_alert_response === 'string')) {
      errors.push('Property "security_alert_response" has invalid type. Expected: string');
    }
  }

  // security_alert_reason (optional)
  if (event.properties.security_alert_reason !== undefined && event.properties.security_alert_reason !== null) {
    if (!(typeof event.properties.security_alert_reason === 'string')) {
      errors.push('Property "security_alert_reason" has invalid type. Expected: string');
    }
  }

  // api_source (optional)
  if (event.properties.api_source !== undefined && event.properties.api_source !== null) {
    if (!(typeof event.properties.api_source === 'string')) {
      errors.push('Property "api_source" has invalid type. Expected: string');
    }
  }

  // request_source (optional)
  if (event.properties.request_source !== undefined && event.properties.request_source !== null) {
    if (!(typeof event.properties.request_source === 'string')) {
      errors.push('Property "request_source" has invalid type. Expected: string');
    }
  }

  // referrer (optional)
  if (event.properties.referrer !== undefined && event.properties.referrer !== null) {
    if (!(typeof event.properties.referrer === 'string')) {
      errors.push('Property "referrer" has invalid type. Expected: string');
    }
  }

  // default_gas (optional)
  if (event.properties.default_gas !== undefined && event.properties.default_gas !== null) {
    if (!(typeof event.properties.default_gas === 'string')) {
      errors.push('Property "default_gas" has invalid type. Expected: string');
    }
  }

  // default_max_fee_per_gas (optional)
  if (event.properties.default_max_fee_per_gas !== undefined && event.properties.default_max_fee_per_gas !== null) {
    if (!(typeof event.properties.default_max_fee_per_gas === 'string')) {
      errors.push('Property "default_max_fee_per_gas" has invalid type. Expected: string');
    }
  }

  // default_max_priority_fee_per_gas (optional)
  if (event.properties.default_max_priority_fee_per_gas !== undefined && event.properties.default_max_priority_fee_per_gas !== null) {
    if (!(typeof event.properties.default_max_priority_fee_per_gas === 'string')) {
      errors.push('Property "default_max_priority_fee_per_gas" has invalid type. Expected: string');
    }
  }

  // gas_limit (optional)
  if (event.properties.gas_limit !== undefined && event.properties.gas_limit !== null) {
    if (!(typeof event.properties.gas_limit === 'string')) {
      errors.push('Property "gas_limit" has invalid type. Expected: string');
    }
  }

  // gas_price (optional)
  if (event.properties.gas_price !== undefined && event.properties.gas_price !== null) {
    if (!(typeof event.properties.gas_price === 'string')) {
      errors.push('Property "gas_price" has invalid type. Expected: string');
    }
  }

  // gas_used (optional)
  if (event.properties.gas_used !== undefined && event.properties.gas_used !== null) {
    if (!(typeof event.properties.gas_used === 'string')) {
      errors.push('Property "gas_used" has invalid type. Expected: string');
    }
  }

  // max_fee_per_gas (optional)
  if (event.properties.max_fee_per_gas !== undefined && event.properties.max_fee_per_gas !== null) {
    if (!(typeof event.properties.max_fee_per_gas === 'string')) {
      errors.push('Property "max_fee_per_gas" has invalid type. Expected: string');
    }
  }

  // max_priority_fee_per_gas (optional)
  if (event.properties.max_priority_fee_per_gas !== undefined && event.properties.max_priority_fee_per_gas !== null) {
    if (!(typeof event.properties.max_priority_fee_per_gas === 'string')) {
      errors.push('Property "max_priority_fee_per_gas" has invalid type. Expected: string');
    }
  }

  // transaction_envelope_type (optional)
  if (event.properties.transaction_envelope_type !== undefined && event.properties.transaction_envelope_type !== null) {
    if (!(typeof event.properties.transaction_envelope_type === 'string')) {
      errors.push('Property "transaction_envelope_type" has invalid type. Expected: string');
    }
  }

  // transaction_contract_address (optional)
  if (event.properties.transaction_contract_address !== undefined && event.properties.transaction_contract_address !== null) {
    if (!(Array.isArray(event.properties.transaction_contract_address))) {
      errors.push('Property "transaction_contract_address" has invalid type. Expected: array');
    }
  }

  // swap_from_token_symbol (optional)
  if (event.properties.swap_from_token_symbol !== undefined && event.properties.swap_from_token_symbol !== null) {
    if (!(typeof event.properties.swap_from_token_symbol === 'string')) {
      errors.push('Property "swap_from_token_symbol" has invalid type. Expected: string');
    }
  }

  // swap_from_token_contract (optional)
  if (event.properties.swap_from_token_contract !== undefined && event.properties.swap_from_token_contract !== null) {
    if (!(typeof event.properties.swap_from_token_contract === 'string')) {
      errors.push('Property "swap_from_token_contract" has invalid type. Expected: string');
    }
  }

  // swap_to_token_symbol (optional)
  if (event.properties.swap_to_token_symbol !== undefined && event.properties.swap_to_token_symbol !== null) {
    if (!(typeof event.properties.swap_to_token_symbol === 'string')) {
      errors.push('Property "swap_to_token_symbol" has invalid type. Expected: string');
    }
  }

  // swap_to_token_contract (optional)
  if (event.properties.swap_to_token_contract !== undefined && event.properties.swap_to_token_contract !== null) {
    if (!(typeof event.properties.swap_to_token_contract === 'string')) {
      errors.push('Property "swap_to_token_contract" has invalid type. Expected: string');
    }
  }

  // hd_entropy_index (optional)
  if (event.properties.hd_entropy_index !== undefined && event.properties.hd_entropy_index !== null) {
    if (!(typeof event.properties.hd_entropy_index === 'number')) {
      errors.push('Property "hd_entropy_index" has invalid type. Expected: number');
    }
  }

  // Handle validation errors
  // Always check schema validation first
  if (errors.length > 0 && !assertFn) {
    // No custom assertions: throw immediately
    throw new Error(`Validation failed for "Transaction Submitted" event:\n${errors.join('\n')}`);
  }

  if (assertFn) {
    // Check schema validation before running custom assertions
    if (errors.length > 0) {
      throw new Error(`Schema validation failed for "Transaction Submitted" event:\n${errors.join('\n')}`);
    }

    // Schema is valid, run custom assertion function(s)
    const assertions = Array.isArray(assertFn) ? assertFn : [assertFn];
    assertions.forEach(fn => fn(event, errors));
  }
}
