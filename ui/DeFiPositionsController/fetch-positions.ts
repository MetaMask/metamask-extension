export type DefiPositionResponse = AdapterResponse<{
  tokens: ProtocolToken[];
}>;

type ProtocolDetails = {
  chainId: number;
  protocolId: string;
  productId: string;
  name: string;
  description: string;
  iconUrl: string;
  siteUrl: string;
  positionType: PositionType;
  metadata?: {
    groupPositions?: boolean;
  };
};

type AdapterResponse<ProtocolResponse> =
  | (ProtocolDetails & {
      chainName: string;
    } & (
        | (ProtocolResponse & { success: true })
        | (AdapterErrorResponse & { success: false })
      ))
  | (AdapterErrorResponse & { success: false });

type AdapterErrorResponse = {
  error: {
    message: string;
  };
};

export type PositionType = 'supply' | 'borrow' | 'stake' | 'reward';

export type ProtocolToken = Balance & {
  type: 'protocol';
  tokenId?: string;
};

export type Underlying = Balance & {
  type: 'underlying' | 'underlying-claimable';
  iconUrl: string;
};

export type Balance = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balanceRaw: string;
  balance: number;
  price?: number; // TODO: Confirm this is the case
  tokens?: Underlying[];
};

// TODO: Update with new API URL
export const DEFAULT_DEFI_POSITIONS_API_URL =
  'https://defi-services.metamask-institutional.io/defi-data/positions';

/**
 * Builds a function that fetches DeFi positions for a given account address
 *
 * @param apiUrl - The URL of the API to fetch the DeFi positions from
 * @returns A function that fetches DeFi positions for a given account address
 */
export function buildPositionFetcher(
  apiUrl: string = DEFAULT_DEFI_POSITIONS_API_URL,
) {
  return async (accountAddress: string): Promise<DefiPositionResponse[]> => {
    const defiPositionsResponse = await fetch(`${apiUrl}/${accountAddress}`);

    if (defiPositionsResponse.status !== 200) {
      throw new Error(
        `Unable to fetch defi positions - HTTP ${defiPositionsResponse.status}`,
      );
    }

    return (await defiPositionsResponse.json()).data;
  };
}
