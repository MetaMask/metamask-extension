import { Infer, nullable, string, type } from '@metamask/superstruct';

export type ScanTokenRequest = {
  chain: string;
  address: string;
  metadata: {
    domain: string;
  };
};

type TokenMetadata = {
  type: string;
  name: string;
  symbol: string;
  image_url: string;
  description: string;
  deployer: string;
  deployer_balance: {
    amount: number | null;
    amount_wei: number | null;
  };
  contract_balance: {
    amount: number;
    amount_wei: string | null;
  } | null;
  owner_balance: {
    amount: number;
    amount_wei: string | null;
  } | null;
  owner: string | null;
  creation_timestamp: number | null;
  external_links: unknown;
  urls: string[];
  malicious_urls: string[];
  token_creation_initiator: string | null;
  mint_authority: string | null;
  update_authority: string | null;
  freeze_authority: string | null;
};

type EvmTokenMetadata = TokenMetadata & {
  decimals: number;
};

export enum TokenFeatureType {
  MALICIOUS = 'Malicious',
  WARNING = 'Warning',
  INFO = 'Info',
  BENIGN = 'Benign',
}

export type TokenFeature = {
  feature_id: string;
  type: TokenFeatureType;
  description: string;
};

export type ScanTokenResponse = {
  result_type: string;
  malicious_score: string;
  attack_types: unknown;
  chain: string;
  address: string;
  metadata: TokenMetadata | EvmTokenMetadata;
  fees: {
    transfer: number | null;
    buy: number | null;
    sell: number | null;
  };
  features: TokenFeature[];
  trading_limits: {
    max_buy: {
      amount: number;
      amount_wei: string;
    } | null;
    max_sell: {
      amount: number;
      amount_wei: string;
    } | null;
    max_holding: {
      amount: number | null;
      amount_wei: number | null;
    } | null;
    sell_limit_per_block: number | null;
  };
  financial_stats: {
    supply: number | null;
    holders_count: number | null;
    usd_price_per_unit: number | null;
    burned_liquidity_percentage: number | null;
    locked_liquidity_percentage: number | null;
    top_holders: {
      address: string;
      holding_percentage: number | null;
    }[];
  };
};

export type TokenAlertWithLabelIds = TokenFeature & {
  titleId: string | null;
  descriptionId: string | null;
};

export type TxAlert = {
  titleId: string;
  description: string;
  descriptionId: string;
};

export const MessageScanResponse = type({
  error: nullable(string()),
  status: string(),
  error_details: nullable(
    type({
      message: string(),
      code: string(),
    }),
  ),
});

export type MessageScanResponse = Infer<typeof MessageScanResponse>;
