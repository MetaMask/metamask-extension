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
  isNativeAddress,
} from '@metamask/bridge-controller';
import { handleFetch } from '@metamask/controller-utils';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { getTransaction1559GasFeeEstimates } from '../../pages/swaps/swaps.util';
import { fetchTokenExchangeRates as fetchTokenExchangeRatesUtil } from '../../helpers/utils/util';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import type { BridgeToken } from './types';

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
  if (isSolanaChainId(chainId)) {
    const queryParams = new URLSearchParams({
      assetIds: tokenAddresses
        .map((address) => toAssetId(address, MultichainNetworks.SOLANA))
        .join(','),
      includeMarketData: 'true',
      vsCurrency: currency,
    });
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
  }
  // EVM chains
  exchangeRates = await fetchTokenExchangeRatesUtil(
    currency,
    tokenAddresses,
    formatChainIdToHex(chainId),
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
  if (isSolanaChainId(chainId) && assetId) {
    return exchangeRates?.[assetId];
  }
  // The exchange rate can be checksummed or not, so we need to check both
  const exchangeRate =
    exchangeRates?.[toChecksumAddress(tokenAddress)] ??
    exchangeRates?.[tokenAddress.toLowerCase()];
  return exchangeRate;
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

export const calculateMaxBridgeAmount = ({
  balance,
  fromToken,
  fromChain,
  activeQuote,
}: {
  balance: string;
  fromToken: BridgeToken | null;
  fromChain?: { chainId: string } | null;
  activeQuote?: { totalMaxNetworkFee?: { amount: string } } | null;
}): string => {
  if (!fromToken || !balance) {
    return '0';
  }

  // For non-native tokens, return full balance
  if (!isNativeAddress(fromToken.address)) {
    return balance;
  }

  // For native tokens, calculate max amount considering gas fees
  const balanceBN = new BigNumber(balance);
  let maxAmount: BigNumber;

  // If we have an active quote, use its totalMaxNetworkFee
  if (activeQuote?.totalMaxNetworkFee?.amount) {
    const networkFee = new BigNumber(activeQuote.totalMaxNetworkFee.amount);

    if (fromChain && isSolanaChainId(fromChain.chainId)) {
      // For Solana, also account for rent exemption
      // The minimumBalanceForRentExemptionInSOL is already considered in the validation
      // but we can add a small buffer for safety
      const buffer = new BigNumber('0.001'); // 0.001 SOL buffer
      maxAmount = balanceBN.minus(networkFee).minus(buffer);
    } else {
      // For EVM chains, subtract the network fee
      maxAmount = balanceBN.minus(networkFee);
    }
  } else if (fromChain && isSolanaChainId(fromChain.chainId)) {
    // If no active quote and it's Solana, use conservative estimate
    const buffer = new BigNumber('0.01'); // 0.01 SOL buffer
    maxAmount = balanceBN.minus(buffer);
  } else {
    // If no active quote and it's EVM, use a reasonable gas buffer
    const gasBuffer = new BigNumber('0.01'); // 0.01 ETH buffer
    maxAmount = balanceBN.minus(gasBuffer);
  }

  // Ensure we don't go negative
  return maxAmount.lte(0) ? '0' : maxAmount.toFixed();
};
