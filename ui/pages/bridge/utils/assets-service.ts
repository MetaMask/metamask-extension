import { toEvmCaipChainId } from "@metamask/multichain-network-controller";
import { Hex, isCaipChainId } from "@metamask/utils";

interface Asset {
  assetId: string;
  name: string;
  symbol: string;
  decimals: number;
  price?: string;
  aggregatedUsdVolume?: string;
  marketCap?: string;
}
export interface AssetsResponse {
  data: Asset[];
  count: number;
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  }
}

function stringifyChainIds(chainIds: string[]) {
  return chainIds.map((id) => isCaipChainId(id) ? id :toEvmCaipChainId(id as Hex)).join(',');
}

function formatAssets(assets: any[]) {}

export async function getPopularAssets(value: string, chainIds: string[]): Promise<AssetsResponse> {
  try {
    const response = await fetch(`https://token.api.cx.metamask.io/v3/tokens/popular?chainIds=${stringifyChainIds(chainIds)}&minLiquidity=0&minVolume24hUsd=0`);
    const data = await response.json() as Asset[];
    return {
      data,
      count: data.length,
      totalCount: data.length,
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    };
  } catch (error) {
    console.error('***********ERROR: No POPULAR ASSETS FOUND***********', error);
    return {
      data: [],
      count: 0,
      totalCount: 0,
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    };
  }
}

export async function searchAssets(value: string, chainIds: string[]): Promise<AssetsResponse> {
  try {
    const response = await fetch(`https://token.api.cx.metamask.io/tokens/search?query=${value}&networks=${stringifyChainIds(chainIds)}`);
    const data = await response.json() as AssetsResponse;
    return data;
  } catch (error) {
    console.error('***********ERROR: No SEARCH ASSETS FOUND***********', error);
    return {
      data: [],
      count: 0,
      totalCount: 0,
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    };
  }
}
