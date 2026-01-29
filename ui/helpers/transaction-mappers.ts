import {
  TransactionGroupCategory,
  NATIVE_TOKEN_ADDRESS,
} from '../../shared/constants/transaction';
import {
  CHAIN_ID_DECIMAL_TO_IMAGE,
  CHAIN_ID_DECIMAL_TO_NAME,
} from '../../shared/constants/network';
import type { V1TransactionByHashResponse } from './types';

// Consider moving these transformations server side

export function extractChainDisplayInfo(chainId: number) {
  const chainImageUrl = CHAIN_ID_DECIMAL_TO_IMAGE[chainId];
  const chainName = CHAIN_ID_DECIMAL_TO_NAME[chainId] || 'Ethereum';

  return {
    chainImageUrl,
    chainName,
  };
}

export function extractCategoryAndAction(
  transaction: V1TransactionByHashResponse,
  accountAddress: string | undefined,
) {
  const { from, to, valueTransfers, methodId } = transaction;

  // Token transfer
  if (valueTransfers && valueTransfers.length > 0) {
    const transfer = valueTransfers[0];
    const isReceive = transfer.to.toLowerCase() === accountAddress;
    const { symbol } = transfer;

    return {
      category: isReceive
        ? TransactionGroupCategory.receive
        : TransactionGroupCategory.send,
      action: isReceive ? `Receive ${symbol || ''}` : `Sent ${symbol || ''}`,
    };
  }

  // Native currency transfer
  if (to && from && accountAddress) {
    const isReceive = to.toLowerCase() === accountAddress;
    const isSend = from.toLowerCase() === accountAddress;

    if (isReceive && !isSend) {
      return {
        category: TransactionGroupCategory.receive,
        action: 'Receive',
      };
    }
    if (isSend && !isReceive) {
      return {
        category: TransactionGroupCategory.send,
        action: 'Send',
      };
    }
  }

  // Contract interaction
  if (methodId && methodId !== '0x' && methodId !== null) {
    return {
      category: TransactionGroupCategory.interaction,
      action: 'Contract Interaction',
    };
  }

  return {
    category: TransactionGroupCategory.interaction,
    action: 'Transaction',
  };
}

export function extractAmountAndSymbol(
  transaction: V1TransactionByHashResponse,
  selectedAddress: string | undefined,
  networksByDecimalChainId: Record<number, { nativeCurrency: string }>,
) {
  const { value, valueTransfers, from, chainId } = transaction;
  const isSend = from?.toLowerCase() === selectedAddress;

  // Token transfer (only if valid transfer data exists)
  if (
    valueTransfers &&
    valueTransfers.length > 0 &&
    valueTransfers[0].contractAddress
  ) {
    const transfer = valueTransfers[0];
    const amt = parseFloat(transfer.amount) / Math.pow(10, transfer.decimal);
    const isTokenSend = transfer.from?.toLowerCase() === selectedAddress;
    return {
      amount: isTokenSend ? -amt : amt,
      symbol: transfer.symbol || '',
    };
  }

  // Native currency
  if (value && value !== '0') {
    const nativeCurrencySymbol =
      networksByDecimalChainId[chainId]?.nativeCurrency || 'ETH';
    const ethValue = parseFloat(value) / 1e18;
    return {
      amount: isSend ? -ethValue : ethValue,
      symbol: nativeCurrencySymbol,
    };
  }

  return { amount: 0, symbol: '' };
}

export function calculateTransactionFiatAmount(
  transaction: V1TransactionByHashResponse,
  amount: number,
  marketData: Record<string, Record<string, { price: number }>>,
  currencyRates: Record<string, { conversionRate: number }>,
  networksByDecimalChainId: Record<number, { nativeCurrency: string }>,
): number | null {
  // Convert marketData to use decimal chainId
  const marketDataByDecimal: Record<
    number,
    Record<string, { price: number }>
  > = {};

  for (const [hexChainId, data] of Object.entries(marketData)) {
    marketDataByDecimal[parseInt(hexChainId, 16)] = data;
  }

  const { value, valueTransfers, chainId } = transaction;

  // Get token address for price lookup
  let tokenAddress;
  if (
    valueTransfers &&
    valueTransfers.length > 0 &&
    valueTransfers[0].contractAddress
  ) {
    tokenAddress = valueTransfers[0].contractAddress;
  } else if (value && value !== '0') {
    tokenAddress = NATIVE_TOKEN_ADDRESS; // Native token
  }

  if (!tokenAddress) {
    return null;
  }

  const chainMarketData = marketDataByDecimal[chainId];

  if (!chainMarketData) {
    return null;
  }

  // Case-insensitive address lookup
  const marketDataKey = Object.keys(chainMarketData).find(
    (key) => key.toLowerCase() === tokenAddress.toLowerCase(),
  );

  if (!marketDataKey) {
    return null;
  }

  const tokenPrice = chainMarketData[marketDataKey]?.price;

  // Get native currency conversion rate to USD
  const nativeCurrency = networksByDecimalChainId[chainId]?.nativeCurrency;
  const conversionRate = currencyRates?.[nativeCurrency]?.conversionRate;

  if (tokenPrice && conversionRate) {
    // Token price is in native currency (ETH), multiply by conversion rate to get USD
    const fiat = amount * tokenPrice * conversionRate;
    return fiat;
  }

  return null;
}
