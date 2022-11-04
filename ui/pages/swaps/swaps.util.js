import BigNumber from 'bignumber.js';
import abi from 'human-standard-token-abi';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  ALLOWED_CONTRACT_ADDRESSES,
  ETHEREUM,
  POLYGON,
  BSC,
  GOERLI,
  AVALANCHE,
  SWAPS_API_V2_BASE_URL,
  SWAPS_DEV_API_V2_BASE_URL,
  SWAPS_CLIENT_ID,
  SWAPS_WRAPPED_TOKENS_ADDRESSES,
} from '../../../shared/constants/swaps';
import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from '../../../shared/modules/swaps.utils';
import { CHAIN_IDS, CURRENCY_SYMBOLS } from '../../../shared/constants/network';
import { getValueFromWeiHex } from '../../helpers/utils/conversions.util';
import { formatCurrency } from '../../helpers/utils/confirm-tx.util';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';

import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';
import {
  calcGasTotal,
  calcTokenAmount,
  decimalToHex,
  toPrecisionWithoutTrailingZeros,
} from '../../../shared/lib/transactions-controller-utils';
import {
  calcTokenValue,
  constructTxParams,
  getBaseApi,
  QUOTE_VALIDATORS,
  truthyString,
  validateData,
} from '../../../shared/lib/swaps-utils';
import { SECOND } from '../../../shared/constants/time';

const CACHE_REFRESH_FIVE_MINUTES = 300000;
const USD_CURRENCY_CODE = 'usd';

const clientIdHeader = { 'X-Client-Id': SWAPS_CLIENT_ID };

const TOKEN_VALIDATORS = [
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

const AGGREGATOR_METADATA_VALIDATORS = [
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

const isValidDecimalNumber = (string) =>
  !isNaN(string) && string.match(/^[.0-9]+$/u) && !isNaN(parseFloat(string));

const SWAP_GAS_PRICE_VALIDATOR = [
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

export const shouldEnableDirectWrapping = (
  chainId,
  sourceToken,
  destinationToken,
) => {
  if (!sourceToken || !destinationToken) {
    return false;
  }
  const wrappedToken = SWAPS_WRAPPED_TOKENS_ADDRESSES[chainId];
  const nativeToken = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.address;
  const sourceTokenLowerCase = sourceToken.toLowerCase();
  const destinationTokenLowerCase = destinationToken.toLowerCase();
  return (
    (sourceTokenLowerCase === wrappedToken &&
      destinationTokenLowerCase === nativeToken) ||
    (sourceTokenLowerCase === nativeToken &&
      destinationTokenLowerCase === wrappedToken)
  );
};

export async function fetchTradesInfo(
  {
    slippage,
    sourceToken,
    sourceDecimals,
    destinationToken,
    value,
    fromAddress,
    exchangeList,
  },
  { chainId },
) {
  const urlParams = {
    destinationToken,
    sourceToken,
    sourceAmount: calcTokenValue(value, sourceDecimals).toString(10),
    slippage,
    timeout: SECOND * 10,
    walletAddress: fromAddress,
  };

  if (exchangeList) {
    urlParams.exchangeList = exchangeList;
  }
  if (shouldEnableDirectWrapping(chainId, sourceToken, destinationToken)) {
    urlParams.enableDirectWrapping = true;
  }

  const queryString = new URLSearchParams(urlParams).toString();
  const tradeURL = `${getBaseApi('trade', chainId)}${queryString}`;
  const tradesResponse = await fetchWithCache(
    tradeURL,
    { method: 'GET', headers: clientIdHeader },
    { cacheRefreshTime: 0, timeout: SECOND * 15 },
  );
  const newQuotes = tradesResponse.reduce((aggIdTradeMap, quote) => {
    if (
      quote.trade &&
      !quote.error &&
      validateData(QUOTE_VALIDATORS, quote, tradeURL)
    ) {
      const constructedTrade = constructTxParams({
        to: quote.trade.to,
        from: quote.trade.from,
        data: quote.trade.data,
        amount: decimalToHex(quote.trade.value),
        gas: decimalToHex(quote.maxGas),
      });

      let { approvalNeeded } = quote;

      if (approvalNeeded) {
        approvalNeeded = constructTxParams({
          ...approvalNeeded,
        });
      }

      return {
        ...aggIdTradeMap,
        [quote.aggregator]: {
          ...quote,
          slippage,
          trade: constructedTrade,
          approvalNeeded,
        },
      };
    }
    return aggIdTradeMap;
  }, {});

  return newQuotes;
}

export async function fetchToken(contractAddress, chainId) {
  const tokenUrl = getBaseApi('token', chainId);
  const token = await fetchWithCache(
    `${tokenUrl}?address=${contractAddress}`,
    { method: 'GET', headers: clientIdHeader },
    { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
  );
  return token;
}

export async function fetchTokens(chainId) {
  const tokensUrl = getBaseApi('tokens', chainId);
  const tokens = await fetchWithCache(
    tokensUrl,
    { method: 'GET', headers: clientIdHeader },
    { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
  );
  const logError = false;
  const filteredTokens = [
    SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId],
    ...tokens.filter((token) => {
      return (
        validateData(TOKEN_VALIDATORS, token, tokensUrl, logError) &&
        !(
          isSwapsDefaultTokenSymbol(token.symbol, chainId) ||
          isSwapsDefaultTokenAddress(token.address, chainId)
        )
      );
    }),
  ];
  return filteredTokens;
}

export async function fetchAggregatorMetadata(chainId) {
  const aggregatorMetadataUrl = getBaseApi('aggregatorMetadata', chainId);
  const aggregators = await fetchWithCache(
    aggregatorMetadataUrl,
    { method: 'GET', headers: clientIdHeader },
    { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
  );
  const filteredAggregators = {};
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

export async function fetchTopAssets(chainId) {
  const topAssetsUrl = getBaseApi('topAssets', chainId);
  const response =
    (await fetchWithCache(
      topAssetsUrl,
      { method: 'GET', headers: clientIdHeader },
      { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
    )) || [];
  const topAssetsMap = response.reduce((_topAssetsMap, asset, index) => {
    if (validateData(TOP_ASSET_VALIDATORS, asset, topAssetsUrl)) {
      return { ..._topAssetsMap, [asset.address]: { index: String(index) } };
    }
    return _topAssetsMap;
  }, {});
  return topAssetsMap;
}

export async function fetchSwapsFeatureFlags() {
  const v2ApiBaseUrl = process.env.SWAPS_USE_DEV_APIS
    ? SWAPS_DEV_API_V2_BASE_URL
    : SWAPS_API_V2_BASE_URL;
  const response = await fetchWithCache(
    `${v2ApiBaseUrl}/featureFlags`,
    { method: 'GET', headers: clientIdHeader },
    { cacheRefreshTime: 600000 },
  );
  return response;
}

export async function fetchTokenPrice(address) {
  const query = `contract_addresses=${address}&vs_currencies=eth`;

  const prices = await fetchWithCache(
    `https://api.coingecko.com/api/v3/simple/token_price/ethereum?${query}`,
    { method: 'GET' },
    { cacheRefreshTime: 60000 },
  );
  return prices && prices[address]?.eth;
}

export async function fetchTokenBalance(address, userAddress) {
  const tokenContract = global.eth.contract(abi).at(address);
  const tokenBalancePromise = tokenContract
    ? tokenContract.balanceOf(userAddress)
    : Promise.resolve();
  const usersToken = await tokenBalancePromise;
  return usersToken;
}

export async function fetchSwapsGasPrices(chainId) {
  const gasPricesUrl = getBaseApi('gasPrices', chainId);
  const response = await fetchWithCache(
    gasPricesUrl,
    { method: 'GET', headers: clientIdHeader },
    { cacheRefreshTime: 30000 },
  );
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
}) => {
  const feeInWeiHex = decimalToHex(feeInWeiDec);
  const ethFee = getValueFromWeiHex({
    value: feeInWeiHex,
    toDenomination: CURRENCY_SYMBOLS.ETH,
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
    nativeCurrencySymbol || SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId].symbol;
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
  gasPrice,
  currentCurrency,
  conversionRate,
  USDConversionRate,
  tradeValue,
  sourceSymbol,
  sourceAmount,
  chainId,
  nativeCurrencySymbol,
}) {
  const totalGasLimitForCalculation = new BigNumber(tradeGas || '0x0', 16)
    .plus(approveGas || '0x0', 16)
    .toString(16);
  const gasTotalInWeiHex = calcGasTotal(totalGasLimitForCalculation, gasPrice);

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
    toDenomination: 'ETH',
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

export function quotesToRenderableData(
  quotes,
  gasPrice,
  conversionRate,
  currentCurrency,
  approveGas,
  tokenConversionRates,
  chainId,
  smartTransactionEstimatedGas,
  nativeCurrencySymbol,
) {
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
    } = quote;
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
        gasPrice,
        currentCurrency,
        conversionRate,
        tradeValue: trade.value,
        sourceSymbol: sourceTokenInfo.symbol,
        sourceAmount,
        chainId,
      }));

    if (smartTransactionEstimatedGas) {
      ({ feeInFiat, feeInEth } = getFeeForSmartTransaction({
        chainId,
        currentCurrency,
        conversionRate,
        nativeCurrencySymbol,
        estimatedFeeInWeiDec: smartTransactionEstimatedGas.feeEstimate,
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

export function formatSwapsValueForDisplay(destinationAmount) {
  let amountToDisplay = toPrecisionWithoutTrailingZeros(destinationAmount, 12);
  if (amountToDisplay.match(/e[+-]/u)) {
    amountToDisplay = new BigNumber(amountToDisplay).toFixed();
  }
  return amountToDisplay;
}

/**
 * Checks whether a contract address is valid before swapping tokens.
 *
 * @param {string} contractAddress - E.g. "0x881d40237659c251811cec9c364ef91dc08d300c" for mainnet
 * @param {string} chainId - The hex encoded chain ID to check
 * @returns {boolean} Whether a contract address is valid or not
 */
export const isContractAddressValid = (
  contractAddress,
  chainId = CHAIN_IDS.MAINNET,
) => {
  if (!contractAddress || !ALLOWED_CONTRACT_ADDRESSES[chainId]) {
    return false;
  }
  return ALLOWED_CONTRACT_ADDRESSES[chainId].some(
    // Sometimes we get a contract address with a few upper-case chars and since addresses are
    // case-insensitive, we compare lowercase versions for validity.
    (allowedContractAddress) =>
      contractAddress.toLowerCase() === allowedContractAddress.toLowerCase(),
  );
};

/**
 * @param {string} chainId
 * @returns string e.g. ethereum, bsc or polygon
 */
export const getNetworkNameByChainId = (chainId) => {
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
    default:
      return '';
  }
};

/**
 * It returns info about if Swaps are enabled and if we should use our new APIs for it.
 *
 * @param {object} swapsFeatureFlags
 * @param {string} chainId
 * @returns object with 2 items: "swapsFeatureIsLive"
 */
export const getSwapsLivenessForNetwork = (swapsFeatureFlags = {}, chainId) => {
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
 * @param {number} value
 * @returns number
 */
export const countDecimals = (value) => {
  if (!value || Math.floor(value) === value) {
    return 0;
  }
  return value.toString().split('.')[1]?.length || 0;
};

export const showRemainingTimeInMinAndSec = (remainingTimeInSec) => {
  if (!Number.isInteger(remainingTimeInSec)) {
    return '0:00';
  }
  const minutes = Math.floor(remainingTimeInSec / 60);
  const seconds = remainingTimeInSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const stxErrorTypes = {
  UNAVAILABLE: 'unavailable',
  NOT_ENOUGH_FUNDS: 'not_enough_funds',
  REGULAR_TX_IN_PROGRESS: 'regular_tx_pending',
};

export const getTranslatedStxErrorMessage = (errorType, t) => {
  switch (errorType) {
    case stxErrorTypes.UNAVAILABLE:
    case stxErrorTypes.REGULAR_TX_IN_PROGRESS:
      return t('stxErrorUnavailable');
    case stxErrorTypes.NOT_ENOUGH_FUNDS:
      return t('stxErrorNotEnoughFunds');
    default:
      return t('stxErrorUnavailable');
  }
};

export const parseSmartTransactionsError = (errorMessage) => {
  const errorJson = errorMessage.slice(12);
  return JSON.parse(errorJson.trim());
};
