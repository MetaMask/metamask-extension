import { isStrictHexString, type CaipChainId, type Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import type { ContractMarketData } from '@metamask/assets-controllers';
import {
  AddNetworkFields,
  NetworkConfiguration,
} from '@metamask/network-controller';
import { toChecksumAddress } from 'ethereumjs-util';
import {
  isSolanaChainId,
  ChainId,
  type TxData,
  formatChainIdToHex,
  BridgeClientId,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { handleFetch } from '@metamask/controller-utils';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { getTransaction1559GasFeeEstimates } from '../../pages/swaps/swaps.util';
import { fetchTokenExchangeRates as fetchTokenExchangeRatesUtil } from '../../helpers/utils/util';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';

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
  chainId: Hex | CaipChainId | ChainId,
  currency: string,
  ...tokenAddresses: string[]
) => {
  let exchangeRates;
  const assetIds = tokenAddresses
    .map((address) => toAssetId(address, formatChainIdToCaip(chainId)))
    .filter(Boolean);
  if (assetIds.length === 0) {
    return {};
  }
  const queryParams = new URLSearchParams({
    assetIds: assetIds.join(','),
    includeMarketData: 'true',
    vsCurrency: currency,
  });
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const url = `https://price.api.cx.metamask.io/v3/spot-prices?${queryParams}`;
  const tokenV3PriceResponse = (await handleFetch(url, {
    method: 'GET',
    headers: { 'X-Client-Id': BridgeClientId.EXTENSION },
  })) as Record<string, { price: number }>;

  exchangeRates = Object.entries(tokenV3PriceResponse).reduce(
    (acc, [k, curr]) => {
      acc[k] = curr.price;
      return acc;
    },
    {} as Record<string, number>,
  );
  return exchangeRates;
};

// This fetches the exchange rate for a token in a given currency. This is only called when the exchange
// rate is not available in the TokenRatesController, which happens when the selected token has not been
// imported into the wallet
export const getTokenExchangeRate = async (request: {
  chainId: Hex | CaipChainId | ChainId;
  tokenAddress: string;
  currency: string;
}) => {
  const { chainId, tokenAddress, currency } = request;
  const exchangeRates = await fetchTokenExchangeRates(
    chainId,
    currency,
    tokenAddress,
  );
  const assetId = toAssetId(tokenAddress, formatChainIdToCaip(chainId));
  return assetId ? exchangeRates?.[assetId] : undefined;
};

// This extracts a token's exchange rate from the marketData state object
// These exchange rates are against the native asset of the chain
export const exchangeRateFromMarketData = (
  chainId: Hex | ChainId | CaipChainId,
  tokenAddress: string,
  marketData?: Record<string, ContractMarketData>,
) =>
  isStrictHexString(tokenAddress) && isStrictHexString(chainId)
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
  v:
    | NetworkConfiguration
    | AddNetworkFields
    | (Omit<NetworkConfiguration, 'chainId'> & { chainId: CaipChainId })
    | undefined,
): v is NetworkConfiguration =>
  v !== undefined &&
  'networkClientId' in v.rpcEndpoints[v.defaultRpcEndpointIndex];
