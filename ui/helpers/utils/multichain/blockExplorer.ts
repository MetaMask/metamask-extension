import { getAccountLink, getTokenTrackerLink } from '@metamask/etherscan-link';
import type { NetworkConfiguration } from '@metamask/network-controller';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  isCaipAssetType,
  KnownCaipNamespace,
  parseCaipAssetType,
  parseCaipChainId,
} from '@metamask/utils';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
  MultichainProviderConfig,
} from '../../../../shared/constants/multichain/networks';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import {
  formatBlockExplorerAddressUrl,
  formatBlockExplorerAssetUrl,
  type MultichainBlockExplorerFormatUrls,
} from '../../../../shared/lib/multichain/networks';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import type { MultichainNetwork } from '../../../selectors/multichain/networks';

/** URL and human-readable label for a block explorer link. */
export type BlockExplorerLink = {
  url: string;
  name: string;
};

/** Options for building a fungible-token block explorer link from Redux network state. */
export type GetFungibleAssetBlockExplorerLinkOptions = {
  /** CAIP-2 chain id (e.g. `eip155:1`, Solana mainnet). */
  caipChainId?: CaipChainId;
  /** Token contract/mint address, or a full CAIP-19 asset id. */
  tokenAddress?: string;
  /** When true, no link is returned (native assets have no token contract page). */
  isNative: boolean;
  /** EVM network configs keyed by hex chain id (`getNetworkConfigurationsByChainId`). */
  evmNetworkConfigurations: Record<Hex, NetworkConfiguration>;
  /** Multichain network configs keyed by CAIP-2 chain id. */
  multichainNetworkConfigurations: Record<
    CaipChainId,
    MultichainNetworkConfiguration
  >;
  /** Display name used when no network name is configured (e.g. "Etherscan"). */
  fallbackExplorerLabel: string;
  /** Optional wallet address appended to EVM token tracker links. */
  walletAddress?: string;
};

/**
 * Normalizes a token address for block explorer URL construction.
 *
 * Accepts either a plain contract/mint address or a CAIP-19 asset id and
 * returns the asset reference when a full asset id is provided.
 *
 * @param tokenAddress - Plain address or CAIP-19 asset id.
 * @returns The contract/mint address, or `undefined` when input is missing.
 */
const resolveContractAddress = (tokenAddress?: string): string | undefined => {
  if (!tokenAddress) {
    return undefined;
  }

  if (isCaipAssetType(tokenAddress)) {
    return parseCaipAssetType(tokenAddress as CaipAssetType).assetReference;
  }

  return tokenAddress;
};

/**
 * Builds a non-EVM block explorer URL for a fungible token.
 *
 * Prefers the network's asset URL template when available (e.g. Solscan token
 * pages); otherwise falls back to the address URL template.
 *
 * @param formatUrls - Block explorer URL templates for the chain.
 * @param contractAddress - Token contract or mint address.
 * @returns The explorer URL, or `null` when templates are unavailable.
 */
const getNonEvmAssetBlockExplorerUrl = (
  formatUrls: MultichainBlockExplorerFormatUrls | undefined,
  contractAddress: string,
): string | null => {
  if (!formatUrls) {
    return null;
  }

  const url = formatUrls.asset
    ? formatBlockExplorerAssetUrl(formatUrls, contractAddress)
    : formatBlockExplorerAddressUrl(formatUrls, contractAddress);

  return url || null;
};

/**
 * Builds a block explorer link for a fungible token on any supported chain.
 *
 * Shared by the TDP "View Asset in explorer" menu item and the Security &
 * Trust detail page official-links section. EVM chains use `getTokenTrackerLink`
 * with the configured explorer base URL; non-EVM chains use
 * `MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP`.
 *
 * @param options - Chain, token, and network configuration inputs.
 * @param options.caipChainId
 * @param options.tokenAddress
 * @param options.isNative
 * @param options.evmNetworkConfigurations
 * @param options.multichainNetworkConfigurations
 * @param options.fallbackExplorerLabel
 * @param options.walletAddress
 * @returns `{ url, name }` for the token's explorer page, or `null` when the
 * token is native, inputs are incomplete, or no explorer is configured.
 */
export const getFungibleAssetBlockExplorerLink = ({
  caipChainId,
  tokenAddress,
  isNative,
  evmNetworkConfigurations,
  multichainNetworkConfigurations,
  fallbackExplorerLabel,
  walletAddress = '',
}: GetFungibleAssetBlockExplorerLinkOptions): BlockExplorerLink | null => {
  const contractAddress = resolveContractAddress(tokenAddress);

  if (!contractAddress || isNative || !caipChainId) {
    return null;
  }

  const multichainNetworkConfig = multichainNetworkConfigurations[caipChainId];

  if (isEvmChainId(caipChainId)) {
    const evmHexChainId = convertCaipToHexChainId(caipChainId);
    const evmNetworkConfig = evmNetworkConfigurations[evmHexChainId];
    const defaultIdx = evmNetworkConfig?.defaultBlockExplorerUrlIndex;
    const blockExplorerUrl =
      defaultIdx === undefined
        ? ''
        : (evmNetworkConfig?.blockExplorerUrls?.[defaultIdx] ?? '');

    return {
      url: getTokenTrackerLink(
        contractAddress,
        evmHexChainId,
        '',
        walletAddress,
        {
          blockExplorerUrl,
        },
      ),
      name:
        multichainNetworkConfig?.name ??
        evmNetworkConfig?.name ??
        fallbackExplorerLabel,
    };
  }

  const formatUrls =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[caipChainId];
  const url = getNonEvmAssetBlockExplorerUrl(formatUrls, contractAddress);

  if (!url) {
    return null;
  }

  return {
    url,
    name: formatUrls?.name ?? multichainNetworkConfig?.name ?? 'Block Explorer',
  };
};

export const getMultichainBlockExplorerUrl = (
  network: MultichainNetwork,
): string => {
  return network.network?.rpcPrefs?.blockExplorerUrl ?? '';
};

export const getMultichainAccountUrl = (
  address: string,
  network: MultichainNetwork,
): string => {
  const { namespace } = parseCaipChainId(network.chainId);
  if (namespace === KnownCaipNamespace.Eip155) {
    const normalizedAddress = normalizeSafeAddress(address);
    return `https://etherscan.io/address/${normalizedAddress}#asset-multichain`;
  }

  // We're in a non-EVM context, so we assume we can use format URLs instead.
  const { blockExplorerFormatUrls } =
    network.network as MultichainProviderConfig;
  if (blockExplorerFormatUrls) {
    return formatBlockExplorerAddressUrl(blockExplorerFormatUrls, address);
  }

  return '';
};

export const getAssetDetailsAccountUrl = (
  address: string,
  network: MultichainNetwork,
): string => {
  const { namespace } = parseCaipChainId(network.chainId);
  if (namespace === KnownCaipNamespace.Eip155) {
    return getAccountLink(
      normalizeSafeAddress(address),
      network.network.chainId,
      network.network?.rpcPrefs,
    );
  }

  const { blockExplorerFormatUrls } =
    network.network as MultichainProviderConfig;

  return getNonEvmAssetBlockExplorerUrl(blockExplorerFormatUrls, address) ?? '';
};
