import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CaipChainId } from '@metamask/utils';
import { NetworkToolbar } from './NetworkToolbar';

// Isolate NetworkToolbar from NetworkChip internals
jest.mock('./NetworkChip', () => ({
  NetworkChip: ({
    network,
    isSelected,
    onClick,
  }: {
    network: { chainId: CaipChainId; name: string };
    isSelected?: boolean;
    onClick: (chainId: CaipChainId) => void;
  }) => (
    <button
      data-testid="network-chip"
      data-selected={String(isSelected)}
      data-chain-id={network.chainId}
      onClick={() => onClick(network.chainId)}
    >
      {network.name}
    </button>
  ),
}));

const NETWORKS = [
  { chainId: 'eip155:1' as CaipChainId, name: 'Mock Chain 1', imageUrl: 'eth.png' },
  {
    chainId: 'eip155:137' as CaipChainId,
    name: 'Mock Chain 137',
    imageUrl: 'matic.png',
  },
  {
    chainId: 'eip155:56' as CaipChainId,
    name: 'BNB Chain',
    imageUrl: 'bnb.png',
  },
];

describe('NetworkToolbar', () => {
  it('renders the container with the correct test id', () => {
    render(
      <NetworkToolbar
        networks={NETWORKS}
        selectedNetworkChainId="eip155:1"
        onClick={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('batch-sell-select-network-toolbar'),
    ).toBeInTheDocument();
  });

  it('renders a chip for every network', () => {
    render(
      <NetworkToolbar
        networks={NETWORKS}
        selectedNetworkChainId="eip155:1"
        onClick={jest.fn()}
      />,
    );

    expect(screen.getAllByTestId('network-chip')).toHaveLength(NETWORKS.length);
  });

  it('renders network names', () => {
    render(
      <NetworkToolbar
        networks={NETWORKS}
        selectedNetworkChainId="eip155:1"
        onClick={jest.fn()}
      />,
    );

    for (const { name } of NETWORKS) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('marks only the selected network chip as selected', () => {
    render(
      <NetworkToolbar
        networks={NETWORKS}
        selectedNetworkChainId="eip155:137"
        onClick={jest.fn()}
      />,
    );

    const chips = screen.getAllByTestId('network-chip');
    const selectedChips = chips.filter((c) => c.dataset.selected === 'true');
    const unselectedChips = chips.filter((c) => c.dataset.selected === 'false');

    expect(selectedChips).toHaveLength(1);
    expect(selectedChips[0]).toHaveTextContent('Mock Chain 137');
    expect(unselectedChips).toHaveLength(NETWORKS.length - 1);
  });

  it('renders no chips when networks list is empty', () => {
    render(
      <NetworkToolbar
        networks={[]}
        selectedNetworkChainId="eip155:1"
        onClick={jest.fn()}
      />,
    );

    expect(screen.queryAllByTestId('network-chip')).toHaveLength(0);
  });

  it('calls onClick with the chainId of the clicked network chip', () => {
    const onClick = jest.fn();

    render(
      <NetworkToolbar
        networks={NETWORKS}
        selectedNetworkChainId="eip155:1"
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByText('Mock Chain 137'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('eip155:137');
  });
});
