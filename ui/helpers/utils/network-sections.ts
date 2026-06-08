import { NON_EVM_TESTNET_IDS } from '@metamask/multichain-network-controller';
import { type CaipChainId } from '@metamask/utils';
import {
  FEATURED_NETWORK_CHAIN_IDS,
  TEST_CHAINS,
} from '../../../shared/constants/network';
import { isEvmChainId } from '../../../shared/lib/asset-utils';
import { convertCaipToHexChainId } from '../../../shared/lib/network.utils';

export type NetworkSectionKey = 'default' | 'custom' | 'test';

export type NetworkSection<TNetwork> = {
  key: NetworkSectionKey;
  titleKey?: 'defaultNetworks' | 'customNetworks' | 'testnets';
  items: TNetwork[];
};

const SECTION_ORDER: NetworkSectionKey[] = ['default', 'custom', 'test'];

const SECTION_TITLE_KEY: Record<
  NetworkSectionKey,
  'defaultNetworks' | 'customNetworks' | 'testnets'
> = {
  default: 'defaultNetworks',
  custom: 'customNetworks',
  test: 'testnets',
};

function normalizeChainId(chainId: string): string {
  if (chainId.includes(':') && isEvmChainId(chainId as CaipChainId)) {
    return convertCaipToHexChainId(chainId as CaipChainId);
  }

  return chainId;
}

export function getNetworkSectionKey(chainId: string): NetworkSectionKey {
  const normalizedChainId = normalizeChainId(chainId);

  if (
    TEST_CHAINS.includes(normalizedChainId) ||
    NON_EVM_TESTNET_IDS.includes(chainId as CaipChainId)
  ) {
    return 'test';
  }

  if (FEATURED_NETWORK_CHAIN_IDS.includes(normalizedChainId)) {
    return 'default';
  }

  return 'custom';
}

export function getNetworkSections<TNetwork extends { chainId: string }>(
  networks: TNetwork[],
  compareFn?: (networkA: TNetwork, networkB: TNetwork) => number,
): NetworkSection<TNetwork>[] {
  const groupedSections = SECTION_ORDER.map((key) => ({
    key,
    items: networks
      .filter((network) => getNetworkSectionKey(network.chainId) === key)
      .sort(compareFn),
  })).filter(({ items }) => items.length > 0);

  const showHeaders = groupedSections.length > 1;

  return groupedSections.map(({ key, items }) => ({
    key,
    titleKey: showHeaders ? SECTION_TITLE_KEY[key] : undefined,
    items,
  }));
}
