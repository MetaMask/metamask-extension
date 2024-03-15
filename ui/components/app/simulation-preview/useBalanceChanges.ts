import {
  SimulationBalanceChange,
  SimulationData,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { useTokenDetails } from '../../../hooks/useTokenDetails';
import { AssetInfo, BalanceChange } from './types';

/**
 * Converts a SimulationBalanceChange to a BalanceChange for the native asset.
 *
 * @param balanceChange
 * @param balanceChange.isDecrease
 * @param balanceChange.difference
 * @returns The converted BalanceChange object.
 */
function getNativeAssetBalanceChange({
  isDecrease,
  difference,
}: SimulationBalanceChange): BalanceChange {
  return {
    assetInfo: { isNative: true },
    isDecrease,
    absChange: new Numeric(difference, 16, EtherDenomination.WEI),
  };
}

function getTokenAssetBalanceChange(
  {
    standard,
    address: contractAddress,
    id: tokenId,
    isDecrease,
    difference,
  }: SimulationTokenBalanceChange,
  strDecimals?: string,
): BalanceChange {
  const absChange: Numeric = (() => {
    switch (standard) {
      case SimulationTokenStandard.erc20: {
        const decimals = strDecimals ? parseInt(strDecimals, 10) : 18;
        return Numeric.from(difference, 16).shiftedBy(decimals);
      }
      case SimulationTokenStandard.erc721:
        return Numeric.from(1, 10);
      case SimulationTokenStandard.erc1155:
        return Numeric.from(difference, 16);
      default:
        throw new Error(`Unknown token standard: ${standard}`);
    }
  })();
  const assetInfo = {
    isNative: false,
    standard,
    contractAddress,
    tokenId,
  } as AssetInfo;

  return {
    assetInfo,
    isDecrease,
    absChange,
  };
}

/**
 * Compiles a list of balance changes from simulation data.
 *
 * @param simulationData
 */
export function useBalanceChanges(simulationData?: SimulationData) {
  if (!simulationData) {
    return { isLoading: false, balanceChanges: [] };
  }
  const { nativeBalanceChange, tokenBalanceChanges } = simulationData;

  const tokenAddresses = useMemo(
    () => [...new Set(tokenBalanceChanges?.map((change) => change.address))],
    [simulationData],
  );
  const { isLoading, addressToTokenDetails } = useTokenDetails(tokenAddresses);

  if (isLoading) {
    return { isLoading: true, balanceChanges: [] };
  }
  const balanceChanges = [];

  if (nativeBalanceChange) {
    balanceChanges.push(getNativeAssetBalanceChange(nativeBalanceChange));
  }
  for (const tokenBalanceChange of tokenBalanceChanges) {
    const { decimals } = addressToTokenDetails[tokenBalanceChange.address];
    balanceChanges.push(
      getTokenAssetBalanceChange(tokenBalanceChange, decimals),
    );
  }

  return { isLoading: false, balanceChanges };
}
