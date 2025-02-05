import { DateTime } from 'luxon';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import {
  formatDateWithYearContext,
  shortenAddress,
} from '../../../helpers/utils/util';

/**
 * Creates a transaction URL for block explorer based on network type
 * Different networks have different URL patterns:
 * Bitcoin Mainnet: https://blockstream.info/tx/{txId}
 * Bitcoin Testnet: https://blockstream.info/testnet/tx/{txId}
 * Solana Mainnet: https://explorer.solana.com/tx/{txId}
 * Solana Devnet: https://explorer.solana.com/tx/{txId}?cluster=devnet
 *
 * @param txId - Transaction ID
 * @param chainId - Network chain ID
 * @returns Full URL to transaction in block explorer, or empty string if no explorer URL
 */
export const getTransactionUrl = (txId: string, chainId: string): string => {
  const explorerBaseUrl =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP[chainId as MultichainNetworks];
  if (!explorerBaseUrl) {
    return '';
  }

  // Change address URL to transaction URL for Bitcoin
  if (chainId.startsWith('bip122:')) {
    return `${explorerBaseUrl.replace('/address', '/tx')}/${txId}`;
  }

  const baseUrl = explorerBaseUrl.split('?')[0];
  if (chainId === MultichainNetworks.SOLANA) {
    return `${baseUrl}tx/${txId}`;
  }
  if (chainId === MultichainNetworks.SOLANA_DEVNET) {
    return `${baseUrl}tx/${txId}?cluster=devnet`;
  }

  return '';
};

/**
 * Creates an address URL for block explorer based on network type
 * Different networks have different URL patterns:
 * Bitcoin Mainnet: https://blockstream.info/address/{address}
 * Bitcoin Testnet: https://blockstream.info/testnet/address/{address}
 * Solana Mainnet: https://explorer.solana.com/address/{address}
 * Solana Devnet: https://explorer.solana.com/address/{address}?cluster=devnet
 *
 * @param address - Wallet address
 * @param chainId - Network chain ID
 * @returns Full URL to address in block explorer, or empty string if no explorer URL
 */
export const getAddressUrl = (address: string, chainId: string): string => {
  const explorerBaseUrl =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP[chainId as MultichainNetworks];

  if (!explorerBaseUrl) {
    return '';
  }

  const baseUrl = explorerBaseUrl.split('?')[0];
  if (chainId === MultichainNetworks.SOLANA) {
    return `${baseUrl}address/${address}`;
  }
  if (chainId === MultichainNetworks.SOLANA_DEVNET) {
    return `${baseUrl}address/${address}?cluster=devnet`;
  }

  // Bitcoin networks already have the correct address URL format
  return `${explorerBaseUrl}/${address}`;
};

/**
 * Formats a timestamp into a localized date and time string
 * Example outputs: "Mar 15, 2024, 14:30" or "Dec 25, 2023, 09:45"
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string, or empty string if timestamp is null
 */
export const formatTimestamp = (timestamp: number | null) => {
  if (!timestamp) {
    return '';
  }

  // It's typical for Solana timestamps to use seconds, while JS Dates and most EVM chains use milliseconds.
  // Hence we needed to use the conversion `timestamp < 1e12 ? timestamp * 1000 : timestamp` for it to work.
  const timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;

  const dateTime = DateTime.fromMillis(timestampMs);
  const date = formatDateWithYearContext(timestampMs, 'MMM d, y', 'MMM d');
  const time = dateTime.toFormat('HH:mm');

  return `${date}, ${time}`;
};

/**
 * Formats a shorten version of a transaction ID.
 *
 * @param txId - Transaction ID.
 * @returns Formatted transaction ID.
 */
export function shortenTransactionId(txId: string) {
  // For transactions we use a similar output for now, but shortenTransactionId will be added later.
  return shortenAddress(txId);
}
