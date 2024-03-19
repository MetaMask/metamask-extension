import {
  SimulationBalanceChange,
  SimulationData,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { useAsyncResultStrict } from '../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../store/actions';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { Numeric } from '../../../../shared/modules/Numeric';
import { getConversionRate } from '../../../ducks/metamask/metamask';
import { getTokenToFiatConversionRates } from '../../../selectors';
import {
  Amount,
  AssetIdentifier,
  BalanceChange,
  FIAT_UNAVAILABLE,
  NativeAssetIdentifier,
} from './types';

const NATIVE_ASSET: NativeAssetIdentifier = { standard: TokenStandard.none };
const NATIVE_DECIMALS = 18;

// Converts a SimulationTokenStandard to a TokenStandard
const convertStandard = (standard: SimulationTokenStandard): TokenStandard => {
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

// Calculates the asset amount based on the balance change and decimals
const getAssetAmount = (
  { isDecrease: isNegative, difference: quantity }: SimulationBalanceChange,
  decimals: number,
): Amount => {
  const numeric = Numeric.from(quantity, 16).shiftedBy(decimals);
  return { isNegative, quantity, decimals, numeric };
};

// Retrieves the non-native asset identifier from the token balance change
const getNonNativeAsset = (
  simBC: SimulationTokenBalanceChange,
): AssetIdentifier =>
  ({
    standard: convertStandard(simBC.standard),
    address: simBC.address,
    tokenId: simBC.id,
  } as AssetIdentifier);

// Fetches token details for all the token addresses in the SimulationTokenBalanceChanges
const fetchErc20Decimals = async (
  addresses: Hex[],
): Promise<Record<Hex, number>> => {
  const uniqueAddresses = [...new Set(addresses)];
  const tokenInfos = await Promise.all(
    uniqueAddresses.map((address) => getTokenStandardAndDetails(address)),
  );

  return tokenInfos.reduce(
    (result, { decimals }, index) => ({
      ...result,
      [uniqueAddresses[index]]: decimals ? parseInt(decimals, 10) : 18,
    }),
    {},
  );
};

// Selector to get fiat conversion rates
const getFiatConversionRates = createSelector(
  getConversionRate,
  getTokenToFiatConversionRates,
  (fromNative, fromTokens) => ({ fromNative, fromTokens }),
);

// Compiles the balance change for the native asset
const getNativeBalanceChange = (
  nativeBalanceChange: SimulationBalanceChange | undefined,
  fiatRates: { fromNative: number },
): BalanceChange | undefined => {
  if (!nativeBalanceChange) {
    return undefined;
  }

  const asset = NATIVE_ASSET;
  const amount = getAssetAmount(nativeBalanceChange, NATIVE_DECIMALS);
  const fiatAmount = amount.numeric.applyConversionRate(fiatRates.fromNative);
  return { asset, amount, fiatAmount };
};

// Compiles the balance changes for token assets
const getTokenBalanceChanges = (
  tokenBalanceChanges: SimulationTokenBalanceChange[],
  erc20Decimals: Record<Hex, number>,
  fiatRates: { fromTokens: Record<Hex, number> },
): BalanceChange[] => {
  return tokenBalanceChanges.map((tokenBc) => {
    const decimals =
      tokenBc.standard === SimulationTokenStandard.erc20
        ? erc20Decimals[tokenBc.address]
        : 0;
    const asset = getNonNativeAsset(tokenBc);
    const amount = getAssetAmount(tokenBc, decimals);
    const fiatRate = fiatRates.fromTokens[tokenBc.address];
    const fiatAmount = fiatRate
      ? amount.numeric.applyConversionRate(fiatRate)
      : FIAT_UNAVAILABLE;
    return { asset, amount, fiatAmount };
  });
};

// Compiles a list of balance changes from simulation data
export const useBalanceChanges = (
  simulationData?: SimulationData,
): { pending: boolean; value: BalanceChange[] } => {
  if (!simulationData) {
    return { pending: false, value: [] };
  }
  const { nativeBalanceChange, tokenBalanceChanges } = simulationData;

  const fiatRates = useSelector(getFiatConversionRates);

  const erc20Decimals = useAsyncResultStrict(() => {
    const erc20Addresses = tokenBalanceChanges
      .filter((tbc) => tbc.standard === SimulationTokenStandard.erc20)
      .map((tbc) => tbc.address);
    return fetchErc20Decimals(erc20Addresses);
  }, [tokenBalanceChanges]);

  if (erc20Decimals.pending) {
    return { pending: true, value: [] };
  }

  const nativeChange = getNativeBalanceChange(nativeBalanceChange, fiatRates);
  const tokenChanges = getTokenBalanceChanges(
    tokenBalanceChanges,
    erc20Decimals.value,
    fiatRates,
  );

  const balanceChanges: BalanceChange[] = [];
  if (nativeChange) {
    balanceChanges.push(nativeChange);
  }
  balanceChanges.push(...tokenChanges);

  return { pending: false, value: balanceChanges };
};
