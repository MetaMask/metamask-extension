import {
  SimulationBalanceChange,
  SimulationData,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  AsyncResultStrict,
  useAsyncResultStrict,
} from '../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../store/actions';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { AssetIdentifier, BalanceChange, NativeAssetIdentifier } from './types';

/**
 * Converts a SimulationBalanceChange to a BalanceChange for the native asset.
 *
 * @param balanceChange
 * @param balanceChange.isDecrease
 * @param balanceChange.difference
 * @returns The converted BalanceChange object.
 */
function convertNativeBalanceChange({
  isDecrease: isNegative,
  difference: quantity,
}: SimulationBalanceChange): BalanceChange {
  const asset: NativeAssetIdentifier = {
    standard: TokenStandard.none,
  };
  return { asset, amount: { isNegative, quantity, decimals: 18 } };
}

/**
 * Converts a SimulationTokenStandard to a TokenStandard.
 *
 * @param standard
 */
const convertStandard = (standard: SimulationTokenStandard) => {
  switch (standard) {
    case SimulationTokenStandard.erc20:
      return TokenStandard.ERC20;
    case SimulationTokenStandard.erc721:
      return TokenStandard.ERC721;
    case SimulationTokenStandard.erc1155:
      return TokenStandard.ERC1155;
    default:
      throw new Error(`Unknown token standard: ${standard}`);
  }
};

/**
 * Converts a SimulationTokenBalanceChange to a BalanceChange.
 *
 * @param simTokenBalanceChange
 * @param decimals
 */
function convertTokenBalanceChange(
  simTokenBalanceChange: SimulationTokenBalanceChange,
  decimals: number,
): BalanceChange {
  const {
    standard: simStandard,
    address,
    id: tokenId,
    isDecrease: isNegative,
    difference: quantity,
  } = simTokenBalanceChange;

  const asset = {
    standard: convertStandard(simStandard),
    address,
    tokenId,
  } as AssetIdentifier;

  return { asset, amount: { isNegative, quantity, decimals } };
}

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
    (result, { decimals }, index) => ({
      ...result,
      [uniqAddresses[index]]: decimals ? parseInt(decimals, 10) : 18,
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

  const erc20Decimals = useAsyncResultStrict(() => {
    return fetchErc20Decimals(
      tokenBalanceChanges
        .filter((tbc) => tbc.standard === SimulationTokenStandard.erc20)
        .map((tbc) => tbc.address),
    );
  }, [tokenBalanceChanges]);

  if (erc20Decimals.pending) {
    return { pending: true };
  }

  const balanceChanges = [];

  if (nativeBalanceChange) {
    balanceChanges.push(convertNativeBalanceChange(nativeBalanceChange));
  }

  for (const tokenBc of tokenBalanceChanges) {
    const decimals =
      tokenBc.standard === SimulationTokenStandard.erc20
        ? erc20Decimals.value[tokenBc.address]
        : 0;
    balanceChanges.push(convertTokenBalanceChange(tokenBc, decimals));
  }

  return { pending: false, value: balanceChanges };
}
