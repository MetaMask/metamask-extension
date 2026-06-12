import { NON_EVM_TESTNET_IDS } from '@metamask/multichain-network-controller';
import { BtcScope, SolScope, TrxScope } from '@metamask/keyring-api';
import { type CaipChainId, type Hex } from '@metamask/utils';
import {
  CHAIN_IDS,
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

function isHexChainId(chainId: string): chainId is Hex {
  return chainId.startsWith('0x');
}

export function getNetworkSectionKey(chainId: string): NetworkSectionKey {
  const normalizedChainId = normalizeChainId(chainId);
  const normalizedHexChainId = isHexChainId(normalizedChainId)
    ? normalizedChainId
    : undefined;

  if (
    (normalizedHexChainId
      ? TEST_CHAINS.includes(normalizedHexChainId)
      : false) ||
    NON_EVM_TESTNET_IDS.includes(chainId as CaipChainId)
  ) {
    return 'test';
  }

  if (
    normalizedHexChainId
      ? FEATURED_NETWORK_CHAIN_IDS.includes(normalizedHexChainId)
      : false
  ) {
    return 'default';
  }

  return 'custom';
}

const FEATURED_NON_EVM_MAINNET_CHAIN_IDS: readonly CaipChainId[] = [
  SolScope.Mainnet,
  BtcScope.Mainnet,
  TrxScope.Mainnet,
];

/**
 * Returns whether a network is a featured default network that can be disabled
 * (without confirmation) rather than deleted.
 * @param chainId
 */
export function isDisableableDefaultNetwork(chainId: string): boolean {
  if (getNetworkSectionKey(chainId) === 'test') {
    return false;
  }

  const normalizedChainId = normalizeChainId(chainId);
  if (isHexChainId(normalizedChainId)) {
    return (
      FEATURED_NETWORK_CHAIN_IDS.includes(normalizedChainId) &&
      normalizedChainId !== CHAIN_IDS.MAINNET
    );
  }

  return FEATURED_NON_EVM_MAINNET_CHAIN_IDS.includes(chainId as CaipChainId);
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

  return groupedSections.map(({ key, items }) => ({
    key,
    titleKey: SECTION_TITLE_KEY[key],
    items,
  }));
}
