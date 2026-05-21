import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { CaipChainId } from '@metamask/utils';
import { NETWORK_TO_NAME_MAP as chainNames } from '../../../shared/constants/network';
import { MULTICHAIN_NETWORK_TO_NICKNAME as multichainNames } from '../../../shared/constants/multichain/networks';
import { convertCaipToHexChainId } from '../../../shared/lib/network.utils';
import { selectEnabledNetworksAsCaipChainIds } from '../../selectors/multichain/networks';

function getEvmChainId(network: string) {
  return network.startsWith('eip155:')
    ? convertCaipToHexChainId(network as CaipChainId)
    : undefined;
}

function getNetworkName(network: string) {
  const chainId = getEvmChainId(network);

  return chainId
    ? (chainNames[chainId as keyof typeof chainNames] ?? network)
    : (multichainNames[network as keyof typeof multichainNames] ?? network);
}

export function NetworkFilter({
  onSelect,
}: {
  onSelect: (networks: string[]) => void;
}) {
  const allNetworks = useSelector(selectEnabledNetworksAsCaipChainIds);
  const [selectedNetwork, setSelectedNetwork] = useState('');

  useEffect(() => {
    onSelect(selectedNetwork ? [selectedNetwork] : allNetworks);
  }, [allNetworks, onSelect, selectedNetwork]);

  return (
    <select
      className="rounded border border-border-muted bg-background-default text-sm"
      value={selectedNetwork}
      onChange={(event) => setSelectedNetwork(event.target.value)}
    >
      <option value="">All networks</option>
      {allNetworks.map((network) => (
        <option key={network} value={network}>
          {getNetworkName(network)}
        </option>
      ))}
    </select>
  );
}
