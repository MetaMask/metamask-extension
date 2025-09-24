import { toEvmCaipChainId } from "@metamask/multichain-network-controller";
import { MultichainNetwork } from "@metamask/multichain-transactions-controller";
import { CaipAssetId, CaipChainId, Hex, isCaipChainId, parseCaipAssetType, parseCaipChainId } from "@metamask/utils";

export interface Asset {
  assetId: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: string;
  price?: string;
  aggregatedUsdVolume?: string;
  marketCap?: string;
  balance?: string;
  tokenFiatAmount?: number;
}

export interface PopularAssetsResponse {
  data: Asset[];
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

export async function getPopularAssets(value: string, chainIds: string[]): Promise<Asset[]> {
  try {
    const response = await fetch(`https://token.api.cx.metamask.io/v3/tokens/popular?chainIds=${stringifyChainIds(chainIds)}&minLiquidity=0&minVolume24hUsd=0`);
    const data = await response.json() as Omit<Asset, 'chainId'>[];
    return data.map((asset) => {
      const { chainId } = parseCaipAssetType(asset.assetId as CaipAssetId);
      if (chainId === MultichainNetwork.Solana) {
        return {
          ...asset,
          chainId: asset.assetId as CaipAssetId,
        }
      } else {
        const { reference } = parseCaipChainId(chainId as CaipChainId);
        return {
          ...asset,
          chainId: `0x${parseInt(reference).toString(16)}`,
        }
      }
    });
  } catch (error) {
    console.error('***********ERROR: No POPULAR ASSETS FOUND***********', error);
    return [];
  }
}

export async function searchAssets(value: string, chainIds: string[], endCursor: string | null): Promise<AssetsResponse> {
  try {
    const baseUrl = `https://token.api.cx.metamask.io/tokens/search?query=${value}&networks=${stringifyChainIds(chainIds)}&first=20`;
    const response = await fetch(endCursor ? `${baseUrl}&after=${endCursor}` : baseUrl);
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
