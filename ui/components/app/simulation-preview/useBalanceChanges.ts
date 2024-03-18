import {
  SimulationBalanceChange,
  SimulationData,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import {
  AsyncResultStrict,
  useAsyncResultStrict,
} from '../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../store/actions';
import { AssetInfo, BalanceChange } from './types';

/**
 * Converts a SimulationBalanceChange to a BalanceChange for the native asset.
 *
 * @param balanceChange
 * @param balanceChange.isDecrease
 * @param balanceChange.difference
 * @returns The converted BalanceChange object.
 */
function convertNativeBalanceChange({
  isDecrease,
  difference,
}: SimulationBalanceChange): BalanceChange {
  return {
    assetInfo: { isNative: true },
    isDecrease,
    absChange: new Numeric(difference, 16, EtherDenomination.WEI),
  };
}

/**
 * Converts a SimulationTokenBalanceChange to a BalanceChange.
 *
 * @param simTokenBalanceChange
 * @param erc20Decimals
 */
function convertTokenBalanceChange(
  simTokenBalanceChange: SimulationTokenBalanceChange,
  erc20Decimals: Record<Hex, number>,
): BalanceChange {
  const {
    standard,
    address: contractAddress,
    id: tokenId,
    isDecrease,
    difference,
  } = simTokenBalanceChange;

  const absChange: Numeric = (() => {
    switch (standard) {
      case SimulationTokenStandard.erc20:
        return Numeric.from(difference, 16).shiftedBy(
          erc20Decimals[contractAddress],
        );

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

export type TokenDetails = Awaited<
  ReturnType<typeof getTokenStandardAndDetails>
>;

/**
 * Fetches token details for all the token addresses in the
 * SimulationTokenBalanceChanges.
 *
 * @param addresses
 */
async function fetchErc20Decimals(addresses: Hex[]) {
  const uniqAddresses = [...new Set(addresses)];

  const tokenInfos = await Promise.all(
    uniqAddresses.map((address) => getTokenStandardAndDetails(address)),
  );

  return tokenInfos.reduce(
    (result, tokenInfo, index) => ({
      ...result,
      [uniqAddresses[index]]: tokenInfo.decimals
        ? parseInt(tokenInfo.decimals, 10)
        : 18,
    }),
    {} as Record<Hex, number>,
  );
}

/**
 * Compiles a list of balance changes from simulation data.
 *
 * @param simulationData
 */
export function useBalanceChanges(
  simulationData?: SimulationData,
): AsyncResultStrict<BalanceChange[]> {
  if (!simulationData) {
    return { pending: false, value: [] };
  }
  const { nativeBalanceChange, tokenBalanceChanges } = simulationData;

  const erc20Decimals = useAsyncResultStrict(
    () =>
      fetchErc20Decimals(
        tokenBalanceChanges
          .filter((tbc) => tbc.standard === SimulationTokenStandard.erc20)
          .map((tbc) => tbc.address),
      ),
    [tokenBalanceChanges],
  );

  if (erc20Decimals.pending) {
    return { pending: true };
  }

  const balanceChanges = [];

  if (nativeBalanceChange) {
    balanceChanges.push(convertNativeBalanceChange(nativeBalanceChange));
  }
  for (const tokenBalanceChange of tokenBalanceChanges) {
    balanceChanges.push(
      convertTokenBalanceChange(tokenBalanceChange, erc20Decimals.value),
    );
  }

  return { pending: false, value: balanceChanges };
}
