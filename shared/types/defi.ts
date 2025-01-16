export type GroupedPositionsResponse = {
  protocolId: string;
  chainId: number;
  positions: (ProtocolDetails & {
    tokens: ProtocolPosition[];
    marketValue: number;
  })[];
  aggregatedValues: Partial<Record<PositionType, number>>;
};

export type DefiPositionResponse = AdapterResponse<{
  tokens: ProtocolPosition[];
}>;

type AdapterResponse<ProtocolResponse> =
  | (ProtocolDetails & {
      chainName: string;
    } & (
        | (ProtocolResponse & { success: true })
        | (AdapterErrorResponse & { success: false })
      ))
  | (AdapterErrorResponse & { success: false });

type ProtocolPosition = TokenBalanceWithUnderlyings & {
  type: 'protocol';
  tokenId?: string;
};

type TokenBalanceWithUnderlyings = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balanceRaw: string;
  balance: number;
  price: number;
  iconUrl: string;
  tokens?: Underlying[];
};

type Underlying = TokenBalanceWithUnderlyings & {
  type: 'underlying' | 'underlying-claimable';
};

type ProtocolDetails = {
  chainId: number;
  protocolId: string;
  productId: string;
  name: string;
  description: string;
  iconUrl: string;
  siteUrl: string;
  positionType: PositionType;
};

type PositionType = 'supply' | 'borrow' | 'stake' | 'reward' | 'fiat-prices';

type AdapterErrorResponse = {
  error: {
    message: string;
  };
};
