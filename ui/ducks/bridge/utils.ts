import { isStrictHexString, type Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import type { ContractMarketData } from '@metamask/assets-controllers';
import {
  AddNetworkFields,
  NetworkConfiguration,
} from '@metamask/network-controller';
import { toChecksumAddress } from 'ethereumjs-util';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import { Numeric } from '../../../shared/modules/Numeric';
import type { TxData } from '../../../shared/types/bridge';
import { getTransaction1559GasFeeEstimates } from '../../pages/swaps/swaps.util';
import { fetchTokenExchangeRates as fetchTokenExchangeRatesUtil } from '../../helpers/utils/util';

type GasFeeEstimate = {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  minWaitTimeEstimate: number;
  maxWaitTimeEstimate: number;
};

type NetworkGasFeeEstimates = {
  low: GasFeeEstimate;
  medium: GasFeeEstimate;
  high: GasFeeEstimate;
  estimatedBaseFee: string;
  historicalBaseFeeRange: [string, string];
  baseFeeTrend: 'up' | 'down';
  latestPriorityFeeRange: [string, string];
  historicalPriorityFeeRange: [string, string];
  priorityFeeTrend: 'up' | 'down';
  networkCongestion: number;
};

// We don't need to use gas multipliers here because the gasLimit from Bridge API already included it
export const getHexMaxGasLimit = (gasLimit: number) => {
  return new Numeric(
    new BigNumber(gasLimit).toString(),
    10,
  ).toPrefixedHexString() as Hex;
};
export const getTxGasEstimates = async ({
  networkAndAccountSupports1559,
  networkGasFeeEstimates,
  txParams,
  hexChainId,
}: {
  networkAndAccountSupports1559: boolean;
  networkGasFeeEstimates: NetworkGasFeeEstimates;
  txParams: TxData;
  hexChainId: Hex;
}) => {
  if (networkAndAccountSupports1559) {
    const { estimatedBaseFee = '0' } = networkGasFeeEstimates;
    const hexEstimatedBaseFee = decGWEIToHexWEI(estimatedBaseFee) as Hex;
    const txGasFeeEstimates = await getTransaction1559GasFeeEstimates(
      {
        ...txParams,
        chainId: hexChainId,
        gasLimit: txParams.gasLimit?.toString(),
      },
      hexEstimatedBaseFee,
      hexChainId,
    );
    return txGasFeeEstimates;
  }

  return {
    baseAndPriorityFeePerGas: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  };
};

const fetchTokenExchangeRates = async (
  chainId: string,
  currency: string,
  ...tokenAddresses: string[]
) => {
  const exchangeRates = await fetchTokenExchangeRatesUtil(
    currency,
    tokenAddresses,
    chainId,
  );
  return Object.keys(exchangeRates).reduce(
    (acc: Record<string, number | undefined>, address) => {
      acc[address] = exchangeRates[address];
      return acc;
    },
    {},
  );
};

// This fetches the exchange rate for a token in a given currency. This is only called when the exchange
// rate is not available in the TokenRatesController, which happens when the selected token has not been
// imported into the wallet
export const getTokenExchangeRate = async (request: {
  chainId: Hex;
  tokenAddress: string;
  currency: string;
}) => {
  const { chainId, tokenAddress, currency } = request;
  const exchangeRates = await fetchTokenExchangeRates(
    chainId,
    currency,
    tokenAddress,
  );
  // The exchange rate can be checksummed or not, so we need to check both
  const exchangeRate =
    exchangeRates?.[toChecksumAddress(tokenAddress)] ??
    exchangeRates?.[tokenAddress.toLowerCase()];
  return exchangeRate;
};

// This extracts a token's exchange rate from the marketData state object
// These exchange rates are against the native asset of the chain
export const exchangeRateFromMarketData = (
  chainId: string,
  tokenAddress: string,
  marketData?: Record<string, ContractMarketData>,
) =>
  isStrictHexString(tokenAddress)
    ? marketData?.[chainId]?.[tokenAddress]?.price
    : undefined;

export const tokenAmountToCurrency = (
  amount: string | BigNumber,
  exchangeRate: number,
) =>
  new Numeric(amount, 10)
    // Stringify exchangeRate before applying conversion to avoid floating point issues
    .applyConversionRate(new BigNumber(exchangeRate.toString(), 10))
    .toNumber();

export const tokenPriceInNativeAsset = (
  tokenExchangeRate?: number | null,
  nativeToCurrencyRate?: number | null,
) => {
  return tokenExchangeRate && nativeToCurrencyRate
    ? tokenExchangeRate / nativeToCurrencyRate
    : null;
};

export const exchangeRatesFromNativeAndCurrencyRates = (
  tokenToNativeAssetRate?: number | null,
  nativeToCurrencyRate?: number | null,
  nativeToUsdRate?: number | null,
) => {
  return {
    valueInCurrency:
      tokenToNativeAssetRate && nativeToCurrencyRate
        ? tokenToNativeAssetRate * nativeToCurrencyRate
        : null,
    usd:
      tokenToNativeAssetRate && nativeToUsdRate
        ? tokenToNativeAssetRate * nativeToUsdRate
        : null,
  };
};

export const isNetworkAdded = (
  v: NetworkConfiguration | AddNetworkFields | undefined,
): v is NetworkConfiguration =>
  v !== undefined &&
  'networkClientId' in v.rpcEndpoints[v.defaultRpcEndpointIndex];
