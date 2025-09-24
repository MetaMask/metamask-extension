import { useMemo } from "react";
import { useMultichainBalances } from "../../../hooks/useMultichainBalances";

export const useFilteredAssetsWithBalance = (network: string | null) => {
  const { assetsWithBalance } = useMultichainBalances();

  const filteredAssets = useMemo(() => {
    if (network) {
      return assetsWithBalance.filter((asset) => asset.chainId === network);
    }
    return assetsWithBalance;
  }, [assetsWithBalance, network]);

  return filteredAssets;
}
