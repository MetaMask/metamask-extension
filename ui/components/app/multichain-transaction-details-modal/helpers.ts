import { DateTime } from 'luxon';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import {
  formatDateWithYearContext,
  shortenAddress,
} from '../../../helpers/utils/util';
import {
  formatBlockExplorerAddressUrl,
  formatBlockExplorerTransactionUrl,
} from '../../../../shared/lib/multichain/networks';

/**
 * Creates a transaction URL for block explorer based on network type
 * Different networks have different URL patterns:
 * Bitcoin Mainnet: https://mempool.space/tx/{txId}
 * Bitcoin Testnet: https://mempool.space/testnet/tx/{txId}
 * Solana Mainnet: https://solscan.io/tx/{txId}
 * Solana Devnet: https://solscan.io/tx/{txId}?cluster=devnet
 *
 * @param txId - Transaction ID
 * @param chainId - Network chain ID
 * @returns Full URL to transaction in block explorer, or empty string if no explorer URL
 */
export const getTransactionUrl = (txId: string, chainId: string): string => {
  const explorerUrls =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
      chainId as MultichainNetworks
    ];
  if (!explorerUrls) {
    return '';
  }

  return formatBlockExplorerTransactionUrl(explorerUrls, txId);
};

/**
 * Creates an address URL for block explorer based on network type
 * Different networks have different URL patterns:
 * Bitcoin Mainnet: https://mempool.space/address/{address}
 * Bitcoin Testnet: https://mempool.space/testnet/address/{address}
 * Solana Mainnet: https://solscan.io/account/{address}
 * Solana Devnet: https://solscan.io/account/{address}?cluster=devnet
 *
 * @param address - Wallet address
 * @param chainId - Network chain ID
 * @returns Full URL to address in block explorer, or empty string if no explorer URL
 */
export const getAddressUrl = (address: string, chainId: string): string => {
  const explorerUrls =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
      chainId as MultichainNetworks
    ];
  if (!explorerUrls) {
    return '';
  }

  return formatBlockExplorerAddressUrl(explorerUrls, address);
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
