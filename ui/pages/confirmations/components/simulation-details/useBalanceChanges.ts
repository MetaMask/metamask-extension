import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  SimulationBalanceChange,
  SimulationData,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { ContractExchangeRates } from '@metamask/assets-controllers';
import { useAsyncResultOrThrow } from '../../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../../store/actions';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import { Numeric } from '../../../../../shared/modules/Numeric';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { getCurrentChainId, getCurrentCurrency } from '../../../../selectors';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import {
  Amount,
  BalanceChange,
  FIAT_UNAVAILABLE,
  NATIVE_ASSET_IDENTIFIER,
  TokenAssetIdentifier,
} from './types';

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
  const uniqueAddresses = [
    ...new Set(addresses.map((address) => address.toLowerCase())),
  ];
  const tokenInfos = await Promise.all(
    uniqueAddresses.map((address) => getTokenStandardAndDetails(address)),
  );
  return Object.fromEntries(
    tokenInfos.map(({ decimals }, index) => [
      uniqueAddresses[index],
      decimals ? parseInt(decimals, 10) : ERC20_DEFAULT_DECIMALS,
    ]),
  );
};

const fetchTokenFiatRates = async (
  fiatCurrency: string,
  erc20TokenAddresses: Hex[],
  chainId: Hex,
): Promise<ContractExchangeRates> => {
  const tokenRates = await fetchTokenExchangeRates(
    fiatCurrency,
    erc20TokenAddresses,
    chainId,
  );

  return Object.fromEntries(
    Object.entries(tokenRates).map(([address, rate]) => [
      address.toLowerCase(),
      rate,
    ]),
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
  const asset = NATIVE_ASSET_IDENTIFIER;
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
  erc20FiatRates: Partial<Record<Hex, number>>,
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

    const fiatRate = erc20FiatRates[tokenBc.address];
    const fiatAmount = fiatRate
      ? amount.numeric.applyConversionRate(fiatRate).toNumber()
      : FIAT_UNAVAILABLE;

    return { asset, amount, fiatAmount };
  });
}

// Compiles a list of balance changes from simulation data
export const useBalanceChanges = (
  simulationData: SimulationData | undefined,
): { pending: boolean; value: BalanceChange[] } => {
  const chainId = useSelector(getCurrentChainId);
  const fiatCurrency = useSelector(getCurrentCurrency);
  const nativeFiatRate = useSelector(getConversionRate);

  const { nativeBalanceChange, tokenBalanceChanges = [] } =
    simulationData ?? {};

  const erc20TokenAddresses = tokenBalanceChanges
    .filter((tbc) => tbc.standard === SimulationTokenStandard.erc20)
    .map((tbc) => tbc.address);

  const erc20Decimals = useAsyncResultOrThrow(
    () => fetchErc20Decimals(erc20TokenAddresses),
    [JSON.stringify(erc20TokenAddresses)],
  );

  const erc20FiatRates = useAsyncResultOrThrow(
    () => fetchTokenFiatRates(fiatCurrency, erc20TokenAddresses, chainId),
    [JSON.stringify(erc20TokenAddresses), fiatCurrency],
  );

  if (erc20Decimals.pending || erc20FiatRates.pending || !simulationData) {
    return { pending: true, value: [] };
  }

  const nativeChange = getNativeBalanceChange(
    nativeBalanceChange,
    nativeFiatRate,
  );
  const tokenChanges = getTokenBalanceChanges(
    tokenBalanceChanges,
    erc20Decimals.value,
    erc20FiatRates.value,
  );

  const balanceChanges: BalanceChange[] = [
    ...(nativeChange ? [nativeChange] : []),
    ...tokenChanges,
  ];
  return { pending: false, value: balanceChanges };
};
