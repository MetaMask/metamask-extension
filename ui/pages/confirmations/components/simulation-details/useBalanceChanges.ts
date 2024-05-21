import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  SimulationBalanceChange,
  SimulationData,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { ContractExchangeRates } from '@metamask/assets-controllers';
import { useAsyncResultOrThrow } from '../../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../../store/actions';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { getCurrentChainId, getCurrentCurrency } from '../../../../selectors';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import {
  BalanceChange,
  FIAT_UNAVAILABLE,
  NATIVE_ASSET_IDENTIFIER,
  TokenAssetIdentifier,
} from './types';

const NATIVE_DECIMALS = 18;

const ERC20_DEFAULT_DECIMALS = 18;

// See https://github.com/MikeMcl/bignumber.js/issues/11#issuecomment-23053776
function convertNumberToStringWithPrecisionWarning(value: number): string {
  return String(value);
}

// Converts a SimulationTokenStandard to a TokenStandard
function convertStandard(standard: SimulationTokenStandard) {
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
}

// Calculates the asset amount based on the balance change and decimals
function getAssetAmount(
  { isDecrease: isNegative, difference: quantity }: SimulationBalanceChange,
  decimals: number,
): BigNumber {
  return (
    new BigNumber(quantity, 16)
      .times(isNegative ? -1 : 1)
      // Shift the decimal point to the left by the number of decimals.
      .shift(-decimals)
  );
}

// Fetches the decimals for the given token address.
async function fetchErc20Decimals(address: Hex): Promise<number> {
  try {
    const { decimals: decStr } = await getTokenStandardAndDetails(address);
    if (!decStr) {
      return ERC20_DEFAULT_DECIMALS;
    }
    for (const radix of [10, 16]) {
      const parsedDec = parseInt(decStr, radix);
      if (isFinite(parsedDec)) {
        return parsedDec;
      }
    }
    return ERC20_DEFAULT_DECIMALS;
  } catch {
    return ERC20_DEFAULT_DECIMALS;
  }
}

// Fetches token details for all the token addresses in the SimulationTokenBalanceChanges
async function fetchAllErc20Decimals(
  addresses: Hex[],
): Promise<Record<Hex, number>> {
  const uniqueAddresses = [
    ...new Set(addresses.map((address) => address.toLowerCase() as Hex)),
  ];
  const allDecimals = await Promise.all(
    uniqueAddresses.map(fetchErc20Decimals),
  );
  return Object.fromEntries(
    allDecimals.map((decimals, i) => [uniqueAddresses[i], decimals]),
  );
}

async function fetchTokenFiatRates(
  fiatCurrency: string,
  erc20TokenAddresses: Hex[],
  chainId: Hex,
): Promise<ContractExchangeRates> {
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
}

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
  const fiatAmount = amount
    .times(convertNumberToStringWithPrecisionWarning(nativeFiatRate))
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
      asset.standard === TokenStandard.ERC20 && erc20Decimals[asset.address]
        ? erc20Decimals[asset.address]
        : 0;
    const amount = getAssetAmount(tokenBc, decimals);

    const fiatRate = erc20FiatRates[tokenBc.address];
    const fiatAmount = fiatRate
      ? amount
          .times(convertNumberToStringWithPrecisionWarning(fiatRate))
          .toNumber()
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
    () => fetchAllErc20Decimals(erc20TokenAddresses),
    [JSON.stringify(erc20TokenAddresses)],
  );

  const erc20FiatRates = useAsyncResultOrThrow(
    () => fetchTokenFiatRates(fiatCurrency, erc20TokenAddresses, chainId),
    [JSON.stringify(erc20TokenAddresses), chainId, fiatCurrency],
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
