import { TransactionType } from '@metamask/transaction-controller';
import {
  TransactionGroupCategory,
  NATIVE_TOKEN_ADDRESS,
} from '../../shared/constants/transaction';
import {
  CHAIN_ID_DECIMAL_TO_IMAGE,
  CHAIN_ID_DECIMAL_TO_NAME,
} from '../../shared/constants/network';
import { mapTransactionTypeToCategory } from '../components/app/transaction-list-item/helpers';
import { getTransactionTypeTitle } from './utils/transactions.util';
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

/**
 * Determines category for API transactions by inferring TransactionType
 * Trusts API's transactionType field for known types, otherwise infers from transaction properties
 *
 * @param transaction
 */
export function inferTransactionTypeFromApiData(
  transaction: V1TransactionByHashResponse,
): TransactionType {
  const { to, methodId, value, valueTransfers, transactionType } = transaction;

  // Use API's transactionType for known types
  if (transactionType === 'ERC_20_APPROVE') {
    return TransactionType.tokenMethodApprove;
  }
  if (transactionType === 'ERC_20_TRANSFER') {
    return TransactionType.tokenMethodTransfer;
  }
  if (transactionType === 'METAMASK_V1_EXCHANGE') {
    return TransactionType.swap;
  }
  if (transactionType === 'METAMASK_BRIDGE_V2_BRIDGE_OUT') {
    return TransactionType.bridge;
  }

  // Token transfers with valueTransfers
  if (valueTransfers && valueTransfers.length > 0) {
    const transfer = valueTransfers[0];
    if (transfer.transferType === 'erc20') {
      return TransactionType.tokenMethodTransfer;
    }
    if (transfer.transferType === 'erc721') {
      return TransactionType.tokenMethodTransferFrom;
    }
    if (transfer.transferType === 'erc1155') {
      return TransactionType.tokenMethodSafeTransferFrom;
    }
  }

  // Contract deployment
  if (!to) {
    return TransactionType.deployContract;
  }

  // Check if sending native currency (ETH, POL, etc.)
  const hasNativeValue =
    value && value !== '0x0' && value !== '0x' && BigInt(value) > 0;

  if (hasNativeValue && (!valueTransfers || valueTransfers.length === 0)) {
    return TransactionType.simpleSend;
  }

  // Has contract interaction data (methodId)
  if (methodId && methodId !== '0x' && methodId !== null) {
    return TransactionType.contractInteraction;
  }

  // Default to simple send
  return TransactionType.simpleSend;
}

export function extractCategoryAndAction(
  transaction: V1TransactionByHashResponse,
  accountAddress: string | undefined,
  t: (key: string, substitutions?: string[]) => string,
) {
  const accountAddressLower = accountAddress?.toLowerCase();
  const { valueTransfers, to, from } = transaction;

  // Check if this is an incoming transaction
  const isReceive = to?.toLowerCase() === accountAddressLower;
  const isSend = from?.toLowerCase() === accountAddressLower;

  // Infer the transaction type from API data
  let inferredType = inferTransactionTypeFromApiData(transaction);

  // If receiving, override to incoming type
  if (isReceive && !isSend) {
    inferredType = TransactionType.incoming;
  }

  // Use V1's categorization logic
  const category = mapTransactionTypeToCategory(inferredType);

  // Get token symbol from valueTransfers if available
  const tokenSymbol =
    valueTransfers && valueTransfers.length > 0
      ? valueTransfers[0].symbol
      : undefined;

  // Get the translated action from V1's title function
  const action = getTransactionTypeTitle(t, inferredType, {
    tokenSymbol,
  });

  return { category: category || TransactionGroupCategory.interaction, action };
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
  if (value && value !== '0' && value !== '0x0') {
    const nativeCurrencySymbol =
      networksByDecimalChainId[chainId]?.nativeCurrency || 'ETH';
    // Use string manipulation to avoid precision loss with very small amounts
    let numericValue: number;
    if (value.startsWith('0x')) {
      // Convert hex to decimal, handling very small values
      const bigIntValue = BigInt(value);
      numericValue = Number(bigIntValue) / 1e18;
    } else {
      numericValue = parseFloat(value) / 1e18;
    }
    return {
      amount: isSend ? -numericValue : numericValue,
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
