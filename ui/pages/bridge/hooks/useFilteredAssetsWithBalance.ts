import { useMemo } from "react";
import { useMultichainBalances } from "../../../hooks/useMultichainBalances";
import { Asset } from "../utils/assets-service";
import { formatAddressToAssetId, formatChainIdToCaip } from "@metamask/bridge-controller";
import { CaipAssetType } from "@metamask/utils";

export const useFilteredAssetsWithBalance = (network: string | null, assets: Asset[]) => {
  const { assetsWithBalance } = useMultichainBalances();

  const filteredAssets = useMemo(() => {
    let baseAssets = assetsWithBalance;

    // if network is provided, we only need to get assets with balance on the same network
    if (network) {
      baseAssets = assetsWithBalance.filter((asset) => asset.chainId === network);
    }

    // if assets are provided, we need to remove the duplicates that already exist in the assetsWithBalance
    if (assets.length > 0) {
      const existingAssetIds = new Set(baseAssets.map((asset) => formatAddressToAssetId(asset.address, asset.chainId)))
      const uniqueNewAssets = assets.filter((asset) => !existingAssetIds.has(asset.assetId as CaipAssetType));
      return [...assetsWithBalance, ...uniqueNewAssets];
    }


    return assetsWithBalance;
  }, [assetsWithBalance, assets, network]);

  return filteredAssets;
}
