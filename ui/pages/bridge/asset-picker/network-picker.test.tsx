import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import configureStore from '../../../store/store';
import { NetworkPicker } from './network-picker';

const mockUseABTest = jest.fn();
const mockUseChainValueOrder = jest.fn();

jest.mock('../../../hooks/useABTest', () => ({
  useABTest: (...args: unknown[]) => mockUseABTest(...args),
}));

jest.mock('../hooks/useChainValueOrder', () => ({
  useChainValueOrder: (...args: unknown[]) => mockUseChainValueOrder(...args),
}));

const chains = [
  { chainId: 'eip155:1' as const, name: 'Ethereum' },
  { chainId: 'eip155:8453' as const, name: 'Base' },
];

const defaultProps = {
  chains,
  selectedChainId: null,
  onNetworkChange: jest.fn(),
  isOpen: true,
  onClose: jest.fn(),
  testId: 'network-picker',
};

function renderNetworkPicker({ isOpen = true }: { isOpen?: boolean } = {}) {
  const state = createBridgeMockStore();

  return renderWithProvider(
    <NetworkPicker {...defaultProps} isOpen={isOpen} />,
    configureStore(state),
  );
}

describe('NetworkPicker chain value order experiment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseABTest.mockReturnValue({
      variant: { orderByValue: false },
      variantName: 'control',
      isActive: true,
    });
    mockUseChainValueOrder.mockReturnValue([...chains].reverse());
  });

  it('preserves LaunchDarkly order and avoids holdings subscriptions in control', () => {
    renderNetworkPicker();

    expect(document.body.textContent?.indexOf('Ethereum')).toBeLessThan(
      document.body.textContent?.indexOf('Base') ?? 0,
    );
    expect(mockUseChainValueOrder).not.toHaveBeenCalled();
  });

  it('renders the all-networks globe as an icon', () => {
    renderNetworkPicker();

    const allNetworksItem = screen.getByTestId('network-picker-all-networks');
    expect(allNetworksItem.querySelector('svg')).toBeInTheDocument();
    expect(allNetworksItem.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders treatment order', () => {
    mockUseABTest.mockReturnValue({
      variant: { orderByValue: true },
      variantName: 'treatment',
      isActive: true,
    });

    renderNetworkPicker();

    expect(document.body.textContent?.indexOf('Base')).toBeLessThan(
      document.body.textContent?.indexOf('Ethereum') ?? 0,
    );
    expect(mockUseChainValueOrder).toHaveBeenCalledWith(chains);
  });

  it('only mounts the treatment ordering hook while the list is open', () => {
    mockUseABTest.mockReturnValue({
      variant: { orderByValue: true },
      variantName: 'treatment',
      isActive: true,
    });

    renderNetworkPicker({ isOpen: false });

    expect(mockUseChainValueOrder).not.toHaveBeenCalled();
    expect(mockUseABTest).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.any(Object),
      { trackExposure: false },
    );
  });

  it('enables exposure tracking when the list is open', () => {
    renderNetworkPicker();

    expect(mockUseABTest).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.any(Object),
      { trackExposure: true },
    );
  });
});
