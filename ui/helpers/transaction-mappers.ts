import {
  TransactionGroupCategory,
  NATIVE_TOKEN_ADDRESS,
} from '../../shared/constants/transaction';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../shared/constants/network';
import type { V1TransactionByHashResponse } from './types';

// Consider moving these transformations server side

export function extractChainDisplayInfo(chainId: number) {
  // Convert decimal chainId to hex format for lookup
  const chainIdHex = `0x${chainId.toString(16)}`;
  const chainImageUrl = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainIdHex];
  const chainName =
    NETWORK_TO_NAME_MAP[chainIdHex as keyof typeof NETWORK_TO_NAME_MAP] ||
    'Ethereum';

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
  networkConfigurationsByChainId: Record<string, { nativeCurrency: string }>,
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
    const chainIdHex = `0x${chainId.toString(16)}`;
    const nativeCurrencySymbol =
      networkConfigurationsByChainId?.[chainIdHex]?.nativeCurrency || 'ETH';
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
  networkConfigurationsByChainId: Record<string, { nativeCurrency: string }>,
): number | null {
  const { value, valueTransfers, chainId } = transaction;
  const chainIdHex = `0x${chainId.toString(16)}`;

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

  const chainMarketData = marketData?.[chainIdHex];

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
  const nativeCurrency =
    networkConfigurationsByChainId?.[chainIdHex]?.nativeCurrency;
  const conversionRate = currencyRates?.[nativeCurrency]?.conversionRate;

  if (tokenPrice && conversionRate) {
    // Token price is in native currency (ETH), multiply by conversion rate to get USD
    const fiat = amount * tokenPrice * conversionRate;
    return fiat;
  }

  return null;
}
