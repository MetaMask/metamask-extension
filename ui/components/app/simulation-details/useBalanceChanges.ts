import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import {
  SimulationBalanceChange,
  SimulationData,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { useAsyncResultOrThrow } from '../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../store/actions';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { Numeric } from '../../../../shared/modules/Numeric';
import { getConversionRate } from '../../../ducks/metamask/metamask';
import {
  getConfirmationExchangeRates,
  getTokenExchangeRates,
} from '../../../selectors';
import {
  Amount,
  BalanceChange,
  FIAT_UNAVAILABLE,
  NativeAssetIdentifier,
  TokenAssetIdentifier,
} from './types';

const NATIVE_ASSET: NativeAssetIdentifier = { standard: TokenStandard.none };
const NATIVE_DECIMALS = 18;
const ERC20_DEFAULT_DECIMALS = 18;

// Converts a SimulationTokenStandard to a TokenStandard
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

// Calculates the asset amount based on the balance change and decimals
const getAssetAmount = (
  { isDecrease: isNegative, difference: quantity }: SimulationBalanceChange,
  decimals: number,
): Amount => {
  const numeric = Numeric.from(quantity, 16)
    .times(isNegative ? -1 : 1, 10)
    .toBase(10)
    .shiftedBy(decimals);
  return { isNegative, quantity, decimals, numeric };
};

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
      [uniqueAddresses[index]]: decimals
        ? parseInt(decimals, 10)
        : ERC20_DEFAULT_DECIMALS,
    }),
    {},
  );
};

// Compiles the balance change for the native asset
function getNativeBalanceChange(
  nativeBalanceChange: SimulationBalanceChange | undefined,
  nativeFiatRate: number,
): BalanceChange | undefined {
  if (!nativeBalanceChange) {
    return undefined;
  }
  const asset = NATIVE_ASSET;
  const amount = getAssetAmount(nativeBalanceChange, NATIVE_DECIMALS);
  const fiatAmount = amount.numeric
    .applyConversionRate(nativeFiatRate)
    .toNumber();
  return { asset, amount, fiatAmount };
}

// Compiles the balance changes for token assets
function getTokenBalanceChanges(
  tokenBalanceChanges: SimulationTokenBalanceChange[],
  erc20Decimals: Record<Hex, number>,
  tokenFiatRates: Record<Hex, number>,
): BalanceChange[] {
  return tokenBalanceChanges.map((tokenBc) => {
    const asset: TokenAssetIdentifier = {
      standard: convertStandard(tokenBc.standard),
      address: tokenBc.address.toLowerCase() as Hex,
      tokenId: tokenBc.id,
    };

    const decimals =
      asset.standard === TokenStandard.ERC20 ? erc20Decimals[asset.address] : 0;
    const amount = getAssetAmount(tokenBc, decimals);

    const fiatRate = tokenFiatRates[tokenBc.address];
    const fiatAmount = fiatRate
      ? amount.numeric.applyConversionRate(fiatRate).toNumber()
      : FIAT_UNAVAILABLE;

    return { asset, amount, fiatAmount };
  });
}

// Get the exchange rates for converting tokens to the user's fiat currency.
const getTokenToFiatConversionRates = createSelector(
  getConversionRate,
  getTokenExchangeRates,
  getConfirmationExchangeRates,
  (nativeToFiat, contractExchangeRates, confirmationExchangeRates) => {
    const mergedRates = {
      ...contractExchangeRates,
      ...confirmationExchangeRates,
    } as Record<string, number>;
    return Object.entries(mergedRates).reduce((acc, [key, value]) => {
      acc[key.toLowerCase()] = nativeToFiat * value;
      return acc;
    }, {} as Record<string, number>);
  },
);

// Compiles a list of balance changes from simulation data
export const useBalanceChanges = (
  simulationData?: SimulationData,
): { pending: boolean; value: BalanceChange[] } => {
  const nativeFiatRate = useSelector(getConversionRate);
  const tokenFiatRates = useSelector(getTokenToFiatConversionRates);

  const { nativeBalanceChange, tokenBalanceChanges } = simulationData ?? {
    tokenBalanceChanges: [],
    nativeBalanceChange: undefined,
  };

  const erc20Decimals = useAsyncResultOrThrow(() => {
    const erc20Addresses = tokenBalanceChanges
      .filter((tbc) => tbc.standard === SimulationTokenStandard.erc20)
      .map((tbc) => tbc.address.toLowerCase() as Hex);
    return fetchErc20Decimals(erc20Addresses);
  }, [tokenBalanceChanges]);

  if (erc20Decimals.pending) {
    return { pending: true, value: [] };
  }

  if (!simulationData) {
    return { pending: false, value: [] };
  }

  const nativeChange = getNativeBalanceChange(
    nativeBalanceChange,
    nativeFiatRate,
  );
  const tokenChanges = getTokenBalanceChanges(
    tokenBalanceChanges,
    erc20Decimals.value,
    tokenFiatRates,
  );

  const balanceChanges: BalanceChange[] = [
    ...(nativeChange ? [nativeChange] : []),
    ...tokenChanges,
  ];
  return { pending: false, value: balanceChanges };
};
