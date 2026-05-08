import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CaipChainId } from '@metamask/utils';
import { NetworkChip } from './NetworkChip';

const NETWORK = {
  chainId: 'eip155:1' as CaipChainId,
  name: 'Mock Chain 1',
  imageUrl: 'https://example.com/eth.png',
};

describe('NetworkChip', () => {
  it('renders the chip with the correct test id', () => {
    render(<NetworkChip network={NETWORK} onClick={jest.fn()} />);

    expect(
      screen.getByTestId('batch-sell-select-network-chip'),
    ).toBeInTheDocument();
  });

  it('renders the network name', () => {
    render(<NetworkChip network={NETWORK} onClick={jest.fn()} />);

    expect(screen.getByText('Mock Chain 1')).toBeInTheDocument();
  });

  it('calls onClick with the network chainId when clicked', () => {
    const onClick = jest.fn();

    render(<NetworkChip network={NETWORK} onClick={onClick} />);

    fireEvent.click(screen.getByTestId('batch-sell-select-network-chip'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('eip155:1');
  });

  describe('selected state', () => {
    it('applies the selected background class when isSelected=true', () => {
      render(<NetworkChip network={NETWORK} isSelected onClick={jest.fn()} />);

      expect(screen.getByTestId('batch-sell-select-network-chip')).toHaveClass(
        'bg-icon-default',
      );
    });

    it('applies the unselected background class when isSelected=false', () => {
      render(
        <NetworkChip
          network={NETWORK}
          isSelected={false}
          onClick={jest.fn()}
        />,
      );

      expect(screen.getByTestId('batch-sell-select-network-chip')).toHaveClass(
        'bg-muted',
      );
    });

    it('applies the unselected background class when isSelected is omitted', () => {
      render(<NetworkChip network={NETWORK} onClick={jest.fn()} />);

      expect(screen.getByTestId('batch-sell-select-network-chip')).toHaveClass(
        'bg-muted',
      );
    });
  });
});
