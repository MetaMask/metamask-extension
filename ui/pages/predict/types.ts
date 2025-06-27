import { Side, Token } from '@polymarket/clob-client';
import { UtilsSide } from './utils';

export type UserPosition = {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
};

export type RoundConfig = {
  readonly price: number;
  readonly size: number;
  readonly amount: number;
};

export type TickSize = '0.1' | '0.01' | '0.001' | '0.0001';

export const ROUNDING_CONFIG: Record<TickSize, RoundConfig> = {
  '0.1': {
    price: 1,
    size: 2,
    amount: 3,
  },
  '0.01': {
    price: 2,
    size: 2,
    amount: 4,
  },
  '0.001': {
    price: 3,
    size: 2,
    amount: 5,
  },
  '0.0001': {
    price: 4,
    size: 2,
    amount: 6,
  },
};

export enum SignatureType {
  /**
   * ECDSA EIP712 signatures signed by EOAs
   */
  EOA,

  /**
   * EIP712 signatures signed by EOAs that own Polymarket Proxy wallets
   */
  POLY_PROXY,

  /**
   * EIP712 signatures signed by EOAs that own Polymarket Gnosis safes
   */
  POLY_GNOSIS_SAFE,
}

// Simplified order for users
export type UserOrder = {
  /**
   * TokenID of the Conditional token asset being traded
   */
  tokenID: string;

  /**
   * Price used to create the order
   */
  price: number;

  /**
   * Size in terms of the ConditionalToken
   */
  size: number;

  /**
   * Side of the order
   */
  side: Side;

  /**
   * Fee rate, in basis points, charged to the order maker, charged on proceeds
   */
  feeRateBps?: number;

  /**
   * Nonce used for onchain cancellations
   */
  nonce?: number;

  /**
   * Timestamp after which the order is expired.
   */
  expiration?: number;

  /**
   * Address of the order taker. The zero address is used to indicate a public order
   */
  taker?: string;
};

export enum OrderType {
  GTC = 'GTC',
  FOK = 'FOK',
  GTD = 'GTD',
  FAK = 'FAK',
}

// Simplified market order for users
export type UserMarketOrder = {
  /**
   * TokenID of the Conditional token asset being traded
   */
  tokenID: string;

  /**
   * Price used to create the order
   * If it is not present the market price will be used.
   */
  price?: number;

  /**
   * BUY orders: $$$ Amount to buy
   * SELL orders: Shares to sell
   */
  amount: number;

  /**
   * Side of the order
   */
  side: Side;

  /**
   * Fee rate, in basis points, charged to the order maker, charged on proceeds
   */
  feeRateBps?: number;

  /**
   * Nonce used for onchain cancellations
   */
  nonce?: number;

  /**
   * Address of the order taker. The zero address is used to indicate a public order
   */
  taker?: string;

  /**
   * Specifies the type of order execution:
   * - FOK (Fill or Kill): The order must be filled entirely or not at all.
   * - FAK (Fill and Kill): The order can be partially filled, and any unfilled portion is canceled.
   */
  orderType?: OrderType.FOK | OrderType.FAK;
};

export type OrderData = {
  /**
   * Maker of the order, i.e the source of funds for the order
   */
  maker: string;

  /**
   * Address of the order taker. The zero address is used to indicate a public order
   */
  taker: string;

  /**
   * Token Id of the CTF ERC1155 asset to be bought or sold.
   * If BUY, this is the tokenId of the asset to be bought, i.e the makerAssetId
   * If SELL, this is the tokenId of the asset to be sold, i.e the  takerAssetId
   */
  tokenId: string;

  /**
   * Maker amount, i.e the max amount of tokens to be sold
   */
  makerAmount: string;

  /**
   * Taker amount, i.e the minimum amount of tokens to be received
   */
  takerAmount: string;

  /**
   * The side of the order, BUY or SELL
   */
  side: UtilsSide;

  /**
   * Fee rate, in basis points, charged to the order maker, charged on proceeds
   */
  feeRateBps: string;

  /**
   * Nonce used for onchain cancellations
   */
  nonce: string;

  /**
   * Signer of the order. Optional, if it is not present the signer is the maker of the order.
   */
  signer?: string;

  /**
   * Timestamp after which the order is expired.
   * Optional, if it is not present the value is '0' (no expiration)
   */
  expiration?: string;

  /**
   * Signature type used by the Order. Default value 'EOA'
   */
  signatureType?: SignatureType;
};

export type Rate = {
  asset_address: string;
  rewards_daily_rate: number;
};

export type Rewards = {
  max_spread: number;
  min_size: number;
  rates: Rate[];
};

export type Market = {
  condition_id: string;
  question_id: string;
  tokens: Token[];
  rewards: Rewards;
  minimum_order_size: string;
  minimum_tick_size: string;
  category: string;
  end_date_iso: string;
  game_start_time: string;
  question: string;
  market_slug: string;
  min_incentive_size: string;
  max_incentive_spread: string;
  active: boolean;
  closed: boolean;
  seconds_delay: number;
  icon: string;
  fpmm: string;
  image: string;
  neg_risk: boolean;
};

export type MarketGamma = {
  conditionId: string;
  image: string;
  question: string;
  endDate: string;
  volume: string;
  negRisk: boolean;
};

export type Activity = {
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: string; // e.g., 'TRADE', 'REDEEM', could be an enum if there are fixed types
  size: number;
  usdcSize: number;
  transactionHash: string;
  price: number;
  asset: string;
  side: string; // e.g., 'BUY' or 'SELL', could be an enum if Side is imported
  outcomeIndex: number;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  name: string;
  pseudonym: string;
  bio: string;
  profileImage: string;
  profileImageOptimized: string;
};
