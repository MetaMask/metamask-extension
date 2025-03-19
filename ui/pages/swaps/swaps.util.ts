import { BigNumber } from 'bignumber.js';
import { Hex, Json } from '@metamask/utils';
import { IndividualTxFees } from '@metamask/smart-transactions-controller/dist/types';
import {
  FeeMarketGasFeeEstimates,
  TransactionParams,
} from '@metamask/transaction-controller';
import {
  ALLOWED_CONTRACT_ADDRESSES,
  ARBITRUM,
  AVALANCHE,
  BASE,
  BSC,
  ETHEREUM,
  GOERLI,
  LINEA,
  OPTIMISM,
  POLYGON,
  ZKSYNC_ERA,
  SWAPS_API_V2_BASE_URL,
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SWAPS_CLIENT_ID,
  SWAPS_DEV_API_V2_BASE_URL,
  SwapsTokenObject,
} from '../../../shared/constants/swaps';
import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from '../../../shared/modules/swaps.utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { formatCurrency } from '../../helpers/utils/confirm-tx.util';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';

import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';
import {
  calcGasTotal,
  calcTokenAmount,
  toPrecisionWithoutTrailingZeros,
} from '../../../shared/lib/transactions-controller-utils';
import {
  getBaseApi,
  truthyString,
  validateData,
} from '../../../shared/lib/swaps-utils';
import {
  addHexes,
  decGWEIToHexWEI,
  decimalToHex,
  getValueFromWeiHex,
  sumHexes,
} from '../../../shared/modules/conversion.utils';
import { EtherDenomination } from '../../../shared/constants/common';
import { estimateGasFee } from '../../store/actions';

const CACHE_REFRESH_FIVE_MINUTES = 300000;
const USD_CURRENCY_CODE = 'usd';

const clientIdHeader = { 'X-Client-Id': SWAPS_CLIENT_ID };

type Validator = {
  property: string;
  type: string;
  validator: (a: string) => boolean;
};

export const TOKEN_VALIDATORS: Validator[] = [
  {
    property: 'address',
    type: 'string',
    validator: (input) => isValidHexAddress(input, { allowNonPrefixed: false }),
  },
  {
    property: 'symbol',
    type: 'string',
    validator: (string) => truthyString(string) && string.length <= 12,
  },
  {
    property: 'decimals',
    type: 'string|number',
    validator: (string) => Number(string) >= 0 && Number(string) <= 36,
  },
];

const TOP_ASSET_VALIDATORS = TOKEN_VALIDATORS.slice(0, 2);

const AGGREGATOR_METADATA_VALIDATORS: Validator[] = [
  {
    property: 'color',
    type: 'string',
    validator: (string) => Boolean(string.match(/^#[A-Fa-f0-9]+$/u)),
  },
  {
    property: 'title',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'icon',
    type: 'string',
    validator: (string) => Boolean(string.match(/^data:image/u)),
  },
];

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isValidDecimalNumber = (string: any): boolean =>
  !isNaN(string) && string.match(/^[.0-9]+$/u) && !isNaN(parseFloat(string));

const SWAP_GAS_PRICE_VALIDATOR: Validator[] = [
  {
    property: 'SafeGasPrice',
    type: 'string',
    validator: isValidDecimalNumber,
  },
  {
    property: 'ProposeGasPrice',
    type: 'string',
    validator: isValidDecimalNumber,
  },
  {
    property: 'FastGasPrice',
    type: 'string',
    validator: isValidDecimalNumber,
  },
];

export async function fetchToken(
  contractAddress: string,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chainId: any,
): Promise<Json> {
  const tokenUrl = getBaseApi('token', chainId);
  return await fetchWithCache({
    url: `${tokenUrl}?address=${contractAddress}`,
    fetchOptions: { method: 'GET', headers: clientIdHeader },
    cacheOptions: { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
    functionName: 'fetchToken',
  });
}

export async function fetchBlockedTokens(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chainId: any,
): Promise<string[]> {
  const blockedTokensUrl = getBaseApi('blockedTokens', chainId);
  return await fetchWithCache({
    url: `${blockedTokensUrl}`,
    fetchOptions: { method: 'GET', headers: clientIdHeader },
    cacheOptions: { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
    functionName: 'fetchBlockedTokens',
  });
}

type Token = { symbol: string; address: string };
export async function fetchTokens(
  chainId: keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
): Promise<SwapsTokenObject[]> {
  const tokensUrl = getBaseApi('tokens', chainId);
  const tokens = await fetchWithCache({
    url: tokensUrl,
    fetchOptions: { method: 'GET', headers: clientIdHeader },
    cacheOptions: { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
    functionName: 'fetchTokens',
  });
  const logError = false;
  const tokenObject = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId] || null;
  return [
    tokenObject,
    ...tokens.filter((token: Token) => {
      return (
        validateData(TOKEN_VALIDATORS, token, tokensUrl, logError) &&
        !(
          isSwapsDefaultTokenSymbol(token.symbol, chainId) ||
          isSwapsDefaultTokenAddress(token.address, chainId)
        )
      );
    }),
  ];
}

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAggregatorMetadata(chainId: any): Promise<object> {
  const aggregatorMetadataUrl = getBaseApi('aggregatorMetadata', chainId);
  const aggregators = await fetchWithCache({
    url: aggregatorMetadataUrl,
    fetchOptions: { method: 'GET', headers: clientIdHeader },
    cacheOptions: { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
    functionName: 'fetchAggregatorMetadata',
  });
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredAggregators = {} as any;
  for (const aggKey in aggregators) {
    if (
      validateData(
        AGGREGATOR_METADATA_VALIDATORS,
        aggregators[aggKey],
        aggregatorMetadataUrl,
      )
    ) {
      filteredAggregators[aggKey] = aggregators[aggKey];
    }
  }
  return filteredAggregators;
}

export async function fetchTopAssetsList(
  chainId: string,
): Promise<{ address: string }[]> {
  const topAssetsUrl = getBaseApi('topAssets', chainId);
  const response =
    (await fetchWithCache({
      url: topAssetsUrl,
      functionName: 'fetchTopAssets',
      fetchOptions: { method: 'GET', headers: clientIdHeader },
      cacheOptions: { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
    })) || [];
  const topAssetsList = response.filter((asset: { address: string }) =>
    validateData(TOP_ASSET_VALIDATORS, asset, topAssetsUrl),
  );
  return topAssetsList;
}

export async function fetchTopAssets(
  chainId: string,
): Promise<Record<string, { index: string }>> {
  const response = await fetchTopAssetsList(chainId);
  const topAssetsMap = response.reduce(
    (_topAssetsMap, asset: { address: string }, index: number) => {
      return { ..._topAssetsMap, [asset.address]: { index: String(index) } };
    },
    {},
  );
  return topAssetsMap;
}

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchSwapsFeatureFlags(): Promise<any> {
  const v2ApiBaseUrl = process.env.SWAPS_USE_DEV_APIS
    ? SWAPS_DEV_API_V2_BASE_URL
    : SWAPS_API_V2_BASE_URL;
  return await fetchWithCache({
    url: `${v2ApiBaseUrl}/featureFlags`,
    fetchOptions: { method: 'GET', headers: clientIdHeader },
    cacheOptions: { cacheRefreshTime: 600000 },
    functionName: 'fetchSwapsFeatureFlags',
  });
}

export async function fetchTokenPrice(
  tokenContractAddress: string,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const query = `spot-prices?tokenAddresses=${tokenContractAddress}&vsCurrency=eth&includeMarketData=false`;

  const prices = await fetchWithCache({
    url: `https://price.api.cx.metamask.io/v2/chains/1/${query}`,
    fetchOptions: {
      method: 'GET',
    },
    cacheOptions: { cacheRefreshTime: 60000 },
    functionName: 'fetchTokenPrice',
  });
  return prices?.[tokenContractAddress]?.eth;
}

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchSwapsGasPrices(chainId: any): Promise<
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | any
  | {
      safeLow: string;
      average: string;
      fast: string;
    }
> {
  const gasPricesUrl = getBaseApi('gasPrices', chainId);
  const response = await fetchWithCache({
    url: gasPricesUrl,
    fetchOptions: { method: 'GET', headers: clientIdHeader },
    cacheOptions: { cacheRefreshTime: 30000 },
    functionName: 'fetchSwapsGasPrices',
  });
  const responseIsValid = validateData(
    SWAP_GAS_PRICE_VALIDATOR,
    response,
    gasPricesUrl,
  );

  if (!responseIsValid) {
    throw new Error(`${gasPricesUrl} response is invalid`);
  }

  const {
    SafeGasPrice: safeLow,
    ProposeGasPrice: average,
    FastGasPrice: fast,
  } = response;

  return {
    safeLow,
    average,
    fast,
  };
}

export const getFeeForSmartTransaction = ({
  chainId,
  currentCurrency,
  conversionRate,
  USDConversionRate,
  nativeCurrencySymbol,
  feeInWeiDec,
}: {
  chainId: keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP;
  currentCurrency: string;
  conversionRate: number;
  USDConversionRate?: number;
  nativeCurrencySymbol: string;
  feeInWeiDec: number;
}) => {
  const feeInWeiHex = decimalToHex(feeInWeiDec);
  const ethFee = getValueFromWeiHex({
    value: feeInWeiHex,
    toDenomination: EtherDenomination.ETH,
    numberOfDecimals: 5,
  });
  const rawNetworkFees = getValueFromWeiHex({
    value: feeInWeiHex,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  });
  let feeInUsd;
  if (currentCurrency === USD_CURRENCY_CODE) {
    feeInUsd = rawNetworkFees;
  } else {
    feeInUsd = getValueFromWeiHex({
      value: feeInWeiHex,
      toCurrency: USD_CURRENCY_CODE,
      conversionRate: USDConversionRate,
      numberOfDecimals: 2,
    });
  }
  const formattedNetworkFee = formatCurrency(rawNetworkFees, currentCurrency);
  const chainCurrencySymbolToUse =
    nativeCurrencySymbol || SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.symbol;
  return {
    feeInUsd,
    feeInFiat: formattedNetworkFee,
    feeInEth: `${ethFee} ${chainCurrencySymbolToUse}`,
    rawEthFee: ethFee,
  };
};

export function getRenderableNetworkFeesForQuote({
  tradeGas,
  approveGas,
  gasPriceTrade,
  gasPriceApprove,
  currentCurrency,
  conversionRate,
  USDConversionRate,
  tradeValue,
  sourceSymbol,
  sourceAmount,
  chainId,
  nativeCurrencySymbol,
  multiLayerL1FeeTotal,
}: {
  tradeGas: string;
  approveGas: string;
  gasPriceTrade: string;
  gasPriceApprove: string;
  currentCurrency: string;
  conversionRate: number;
  USDConversionRate?: number;
  tradeValue: number;
  sourceSymbol: string;
  sourceAmount: number;
  chainId: keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP;
  nativeCurrencySymbol?: string;
  multiLayerL1FeeTotal: string | null;
}): {
  rawNetworkFees: string | number | BigNumber;
  feeInUsd: string | number | BigNumber;
  rawEthFee: string | number | BigNumber;
  feeInFiat: string;
  feeInEth: string;
  nonGasFee: string;
} {
  const tradeGasFeeTotalHex = calcGasTotal(tradeGas, gasPriceTrade);

  const approveGasFeeTotalHex = approveGas
    ? calcGasTotal(approveGas, gasPriceApprove)
    : '0x0';

  const gasTotalInWeiHex = sumHexes(
    tradeGasFeeTotalHex,
    approveGasFeeTotalHex,
    multiLayerL1FeeTotal || '0x0',
  );

  const nonGasFee = new BigNumber(tradeValue, 16)
    .minus(
      isSwapsDefaultTokenSymbol(sourceSymbol, chainId) ? sourceAmount : 0,
      10,
    )
    .toString(16);

  const totalWeiCost = new BigNumber(gasTotalInWeiHex, 16)
    .plus(nonGasFee, 16)
    .toString(16);
  const ethFee = getValueFromWeiHex({
    value: totalWeiCost,
    toDenomination: EtherDenomination.ETH,
    numberOfDecimals: 5,
  });
  const rawNetworkFees = getValueFromWeiHex({
    value: totalWeiCost,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  });
  const formattedNetworkFee = formatCurrency(rawNetworkFees, currentCurrency);

  let feeInUsd;
  if (currentCurrency === USD_CURRENCY_CODE) {
    feeInUsd = rawNetworkFees;
  } else {
    feeInUsd = getValueFromWeiHex({
      value: totalWeiCost,
      toCurrency: USD_CURRENCY_CODE,
      conversionRate: USDConversionRate,
      numberOfDecimals: 2,
    });
  }

  const chainCurrencySymbolToUse =
    nativeCurrencySymbol || SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId].symbol;

  return {
    rawNetworkFees,
    feeInUsd,
    rawEthFee: ethFee,
    feeInFiat: formattedNetworkFee,
    feeInEth: `${ethFee} ${chainCurrencySymbolToUse}`,
    nonGasFee,
  };
}

export function quotesToRenderableData({
  quotes,
  gasPriceTrade,
  gasPriceApprove,
  conversionRate,
  currentCurrency,
  approveGas,
  tokenConversionRates,
  chainId,
  smartTransactionEstimatedGas,
  nativeCurrencySymbol,
  multiLayerL1ApprovalFeeTotal,
}: {
  quotes: object;
  gasPriceTrade: string;
  gasPriceApprove: string;
  conversionRate: number;
  currentCurrency: string;
  approveGas: string;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenConversionRates: Record<string, any>;
  chainId: keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP;
  smartTransactionEstimatedGas: IndividualTxFees;
  nativeCurrencySymbol: string;
  multiLayerL1ApprovalFeeTotal: string | null;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Record<string, any> {
  return Object.values(quotes).map((quote) => {
    const {
      destinationAmount = 0,
      sourceAmount = 0,
      sourceTokenInfo,
      destinationTokenInfo,
      slippage,
      aggType,
      aggregator,
      gasEstimateWithRefund,
      averageGas,
      fee,
      trade,
      multiLayerL1TradeFeeTotal,
    } = quote;
    let multiLayerL1FeeTotal = null;
    if (
      multiLayerL1TradeFeeTotal !== null &&
      multiLayerL1ApprovalFeeTotal !== null
    ) {
      multiLayerL1FeeTotal = sumHexes(
        multiLayerL1TradeFeeTotal || '0x0',
        multiLayerL1ApprovalFeeTotal || '0x0',
      );
    } else if (multiLayerL1TradeFeeTotal !== null) {
      multiLayerL1FeeTotal = multiLayerL1TradeFeeTotal;
    }
    const sourceValue = calcTokenAmount(
      sourceAmount,
      sourceTokenInfo.decimals,
    ).toString(10);
    const destinationValue = calcTokenAmount(
      destinationAmount,
      destinationTokenInfo.decimals,
    ).toPrecision(8);

    let feeInFiat = null;
    let feeInEth = null;
    let rawNetworkFees = null;
    let rawEthFee = null;

    ({ feeInFiat, feeInEth, rawNetworkFees, rawEthFee } =
      getRenderableNetworkFeesForQuote({
        tradeGas: gasEstimateWithRefund || decimalToHex(averageGas || 800000),
        approveGas,
        gasPriceTrade,
        gasPriceApprove,
        currentCurrency,
        conversionRate,
        tradeValue: trade.value,
        sourceSymbol: sourceTokenInfo.symbol,
        sourceAmount,
        chainId,
        multiLayerL1FeeTotal,
      }));

    if (smartTransactionEstimatedGas) {
      ({ feeInFiat, feeInEth } = getFeeForSmartTransaction({
        chainId,
        currentCurrency,
        conversionRate,
        nativeCurrencySymbol,
        feeInWeiDec: smartTransactionEstimatedGas.feeEstimate,
      }));
    }

    const slippageMultiplier = new BigNumber(100 - slippage).div(100);
    const minimumAmountReceived = new BigNumber(destinationValue)
      .times(slippageMultiplier)
      .toFixed(6);

    const tokenConversionRate =
      tokenConversionRates[destinationTokenInfo.address];
    const ethValueOfTrade = isSwapsDefaultTokenSymbol(
      destinationTokenInfo.symbol,
      chainId,
    )
      ? calcTokenAmount(destinationAmount, destinationTokenInfo.decimals).minus(
          rawEthFee,
          10,
        )
      : new BigNumber(tokenConversionRate || 0, 10)
          .times(
            calcTokenAmount(destinationAmount, destinationTokenInfo.decimals),
            10,
          )
          .minus(rawEthFee, 10);

    let liquiditySourceKey;
    let renderedSlippage = slippage;

    if (aggType === 'AGG') {
      liquiditySourceKey = 'swapAggregator';
    } else if (aggType === 'RFQ') {
      liquiditySourceKey = 'swapRequestForQuotation';
      renderedSlippage = 0;
    } else if (aggType === 'DEX') {
      liquiditySourceKey = 'swapDecentralizedExchange';
    } else if (aggType === 'CONTRACT') {
      liquiditySourceKey = 'swapDirectContract';
    } else {
      liquiditySourceKey = 'swapUnknown';
    }

    return {
      aggId: aggregator,
      amountReceiving: `${destinationValue} ${destinationTokenInfo.symbol}`,
      destinationTokenDecimals: destinationTokenInfo.decimals,
      destinationTokenSymbol: destinationTokenInfo.symbol,
      destinationTokenValue: formatSwapsValueForDisplay(destinationValue),
      destinationIconUrl: destinationTokenInfo.iconUrl,
      isBestQuote: quote.isBestQuote,
      liquiditySourceKey,
      feeInEth,
      detailedNetworkFees: `${feeInEth} (${feeInFiat})`,
      networkFees: feeInFiat,
      quoteSource: aggType,
      rawNetworkFees,
      slippage: renderedSlippage,
      sourceTokenDecimals: sourceTokenInfo.decimals,
      sourceTokenSymbol: sourceTokenInfo.symbol,
      sourceTokenValue: sourceValue,
      sourceTokenIconUrl: sourceTokenInfo.iconUrl,
      ethValueOfTrade,
      minimumAmountReceived,
      metaMaskFee: fee,
    };
  });
}

export function formatSwapsValueForDisplay(
  destinationAmount: string | BigNumber,
): string {
  let amountToDisplay;
  if (
    typeof destinationAmount === 'string' &&
    destinationAmount.includes('...')
  ) {
    amountToDisplay = destinationAmount;
  } else {
    amountToDisplay = toPrecisionWithoutTrailingZeros(destinationAmount, 12);
  }
  if (amountToDisplay.match(/e[+-]/u)) {
    amountToDisplay = new BigNumber(amountToDisplay).toFixed();
  }
  return amountToDisplay;
}

export const getClassNameForCharLength = (
  num: string,
  classNamePrefix: string,
): string => {
  let modifier;
  if (!num || num.length <= 10) {
    modifier = 'lg';
  } else if (num.length > 10 && num.length <= 13) {
    modifier = 'md';
  } else {
    modifier = 'sm';
  }
  return `${classNamePrefix}--${modifier}`;
};

/**
 * Checks whether a contract address is valid before swapping tokens.
 *
 * @param contractAddress - E.g. "0x881d40237659c251811cec9c364ef91dc08d300c" for mainnet
 * @param chainId - The hex encoded chain ID to check
 * @returns Whether a contract address is valid or not
 */
export const isContractAddressValid = (
  contractAddress: string,
  chainId: keyof typeof ALLOWED_CONTRACT_ADDRESSES,
): boolean => {
  if (!contractAddress || !ALLOWED_CONTRACT_ADDRESSES[chainId]) {
    return false;
  }
  return ALLOWED_CONTRACT_ADDRESSES[chainId].some(
    // Sometimes we get a contract address with a few upper-case chars and since addresses are
    // case-insensitive, we compare lowercase versions for validity.
    (allowedContractAddress: string) =>
      contractAddress.toLowerCase() === allowedContractAddress.toLowerCase(),
  );
};

/**
 * @param chainId
 * @returns string e.g. ethereum, bsc or polygon
 */
export const getNetworkNameByChainId = (chainId: string): string => {
  switch (chainId) {
    case CHAIN_IDS.MAINNET:
      return ETHEREUM;
    case CHAIN_IDS.BSC:
      return BSC;
    case CHAIN_IDS.POLYGON:
      return POLYGON;
    case CHAIN_IDS.GOERLI:
      return GOERLI;
    case CHAIN_IDS.AVALANCHE:
      return AVALANCHE;
    case CHAIN_IDS.OPTIMISM:
      return OPTIMISM;
    case CHAIN_IDS.ARBITRUM:
      return ARBITRUM;
    case CHAIN_IDS.ZKSYNC_ERA:
      return ZKSYNC_ERA;
    case CHAIN_IDS.LINEA_MAINNET:
      return LINEA;
    case CHAIN_IDS.BASE:
      return BASE;
    default:
      return '';
  }
};

/**
 * It returns info about if Swaps are enabled and if we should use our new APIs for it.
 *
 * @param chainId
 * @param swapsFeatureFlags
 * @returns object with 2 items: "swapsFeatureIsLive"
 */
export const getSwapsLivenessForNetwork = (
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chainId: any,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  swapsFeatureFlags: any = {},
) => {
  const networkName = getNetworkNameByChainId(chainId);
  // Use old APIs for testnet and Goerli.
  if ([CHAIN_IDS.LOCALHOST, CHAIN_IDS.GOERLI].includes(chainId)) {
    return {
      swapsFeatureIsLive: true,
    };
  }
  // If a network name is not found in the list of feature flags, disable Swaps.
  if (!swapsFeatureFlags[networkName]) {
    return {
      swapsFeatureIsLive: false,
    };
  }
  const isNetworkEnabledForNewApi =
    swapsFeatureFlags[networkName].extensionActive;
  if (isNetworkEnabledForNewApi) {
    return {
      swapsFeatureIsLive: true,
    };
  }
  return {
    swapsFeatureIsLive: swapsFeatureFlags[networkName].fallbackToV1,
  };
};

/**
 * @param value
 * @returns number
 */
// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const countDecimals = (value: any): number => {
  if (!value || Math.floor(value) === value) {
    return 0;
  }
  return value.toString().split('.')[1]?.length || 0;
};

export const showRemainingTimeInMinAndSec = (
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remainingTimeInSec: any,
): string => {
  if (!Number.isInteger(remainingTimeInSec)) {
    return '0:00';
  }
  const minutes = Math.floor(remainingTimeInSec / 60);
  const seconds = remainingTimeInSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export enum StxErrorTypes {
  unavailable = 'unavailable',
  notEnoughFunds = 'not_enough_funds',
  regularTxPending = 'regular_tx_pending',
}

export const getTranslatedStxErrorMessage = (
  errorType: StxErrorTypes,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (...args: any[]) => string,
): string => {
  switch (errorType) {
    case StxErrorTypes.unavailable:
    case StxErrorTypes.regularTxPending:
      return t('smartSwapsErrorUnavailable');
    case StxErrorTypes.notEnoughFunds:
      return t('smartSwapsErrorNotEnoughFunds');
    default:
      return t('smartSwapsErrorUnavailable');
  }
};

export const parseSmartTransactionsError = (errorMessage: string): string => {
  const errorJson = errorMessage.slice(12);
  return JSON.parse(errorJson.trim());
};

export const getSwap1559GasFeeEstimates = async (
  tradeTxParams: TransactionParams,
  approveTxParams: TransactionParams | undefined,
  estimatedBaseFeeGwei: string,
  chainId: Hex,
) => {
  const estimatedBaseFee = decGWEIToHexWEI(estimatedBaseFeeGwei) as Hex;

  const tradeGasFeeEstimates = await getTransaction1559GasFeeEstimates(
    tradeTxParams,
    estimatedBaseFee,
    chainId,
  );

  const approveGasFeeEstimates = approveTxParams
    ? await getTransaction1559GasFeeEstimates(
        approveTxParams,
        estimatedBaseFee,
        chainId,
      )
    : undefined;

  return {
    tradeGasFeeEstimates,
    approveGasFeeEstimates,
    estimatedBaseFee,
  };
};

async function getTransaction1559GasFeeEstimates(
  transactionParams: TransactionParams,
  estimatedBaseFee: Hex,
  chainId: Hex,
) {
  const transactionGasFeeResponse = await estimateGasFee({
    transactionParams,
    chainId,
  });

  const transactionGasFeeEstimates = transactionGasFeeResponse?.estimates as
    | FeeMarketGasFeeEstimates
    | undefined;

  const { maxFeePerGas } = transactionGasFeeEstimates?.high ?? {};
  const { maxPriorityFeePerGas } = transactionGasFeeEstimates?.high ?? {};

  const baseAndPriorityFeePerGas = maxPriorityFeePerGas
    ? (addHexes(estimatedBaseFee, maxPriorityFeePerGas) as Hex)
    : undefined;

  return {
    baseAndPriorityFeePerGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
}
