import { useMemo } from "react";
import { useMultichainBalances } from "../../../hooks/useMultichainBalances";
import { Asset } from "../utils/assets-service";
import { formatAddressToAssetId, formatChainIdToCaip } from "@metamask/bridge-controller";
import { CaipAssetId } from "@metamask/utils";

export const useFilteredAssetsWithBalance = (network: string | null, assets: Asset[]) => {
  const { assetsWithBalance } = useMultichainBalances();

  const formattedAssetsWithBalance = useMemo(() => assetsWithBalance.map((asset) => ({
    assetId: formatAddressToAssetId(asset.address, asset.chainId),
    name: (asset as any).name || (asset as any).title || asset.symbol,
    symbol: asset.symbol,
    decimals: asset.decimals,
    chainId: asset.chainId,
    balance: asset.string,
    tokenFiatAmount: asset.tokenFiatAmount,
  })) as Asset[], [assetsWithBalance]);

  const filteredAssets = useMemo(() => {
    let baseAssets = formattedAssetsWithBalance;

    // if network is provided, we only need to get assets with balance on the same network
    if (network !== null) {
      baseAssets = formattedAssetsWithBalance.filter((asset) => {
        return parseInt(asset.chainId) === parseInt(network)
      });
    }

    console.log("**********BASE ASSETS***********", baseAssets);

    // if assets are provided, we need to remove the duplicates that already exist in the assetsWithBalance
    if (assets.length > 0) {
      const existingAssetIds = new Set(baseAssets.map((asset) => asset.assetId))
      const uniqueNewAssets = assets.filter((asset) => !existingAssetIds.has(asset.assetId as CaipAssetId));
      return [...baseAssets, ...uniqueNewAssets] as Asset[];
    }


    return baseAssets;
  }, [assetsWithBalance, assets, network]);

  return filteredAssets;
}
