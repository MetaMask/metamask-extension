import { StatusTypes } from '@metamask/bridge-controller';
import type { CaipChainId } from '@metamask/utils';

export enum ActionType {
  CROSSCHAIN_V1 = 'crosschain-v1',
  SWAPBRIDGE_V1 = 'swapbridge-v1',
}

export type RequestParams = {
  chain_id_source: CaipChainId;
  chain_id_destination?: CaipChainId;
  token_symbol_source: string;
  token_symbol_destination?: string;
  token_address_source: string;
  token_address_destination?: string;
};

export type RequestMetadata = {
  slippage_limit: number;
  custom_slippage: boolean;
  usd_amount_source: number;
  stx_enabled: boolean;
  is_hardware_wallet: boolean;
  swap_type: ActionType;
};

export type QuoteFetchData = {
  can_submit: boolean;
  best_quote_provider?: `${string}_${string}`;
  quotes_count: number;
  quotes_list: `${string}_${string}`[];
  initial_load_time_all_quotes: number;
};

export type TradeData = {
  usd_quoted_gas: number;
  gas_included: boolean;
  quoted_time_minutes: number;
  usd_quoted_return: number;
  provider: `${string}_${string}`;
};

export type TxStatusData = {
  allowance_reset_transaction?: StatusTypes;
  approval_transaction?: StatusTypes;
  source_transaction?: StatusTypes;
  destination_transaction?: StatusTypes;
};
