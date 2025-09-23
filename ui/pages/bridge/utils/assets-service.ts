import { toEvmCaipChainId } from "@metamask/multichain-network-controller";
import { Hex, isCaipChainId } from "@metamask/utils";

function stringifyChainIds(chainIds: string[]) {
  return chainIds.map((id) => isCaipChainId(id) ? id :toEvmCaipChainId(id as Hex)).join(',');
}

export async function getPopularAssets(value: string, chainIds: string[]) {
  try {
    const response = await fetch(`https://token.api.cx.metamask.io/v3/tokens/popular?chainIds=${stringifyChainIds(chainIds)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('***********ERROR: No POPULAR ASSETS FOUND***********', error);
    return [];
  }
}

export async function searchAssets(value: string, chainIds: string[]) {
  const response = await fetch(`https://token.api.cx.metamask.io/tokens/search?query=${value}&networks=${stringifyChainIds(chainIds)}`);
}
