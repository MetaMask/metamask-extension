import { toEvmCaipChainId } from "@metamask/multichain-network-controller";
import { Hex, isCaipChainId } from "@metamask/utils";

export async function getPopularAssets(value: string, chainIds: string[]) {
  const stringifiedIds = chainIds.map((id) => isCaipChainId(id) ? id :toEvmCaipChainId(id as Hex));
  console.log('***********PAYLOAD***********', { value, stringifiedIds });
}
