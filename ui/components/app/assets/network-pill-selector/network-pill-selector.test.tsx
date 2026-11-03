import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { useHomeNetworkFilter } from '../asset-list/asset-list-control-bar/use-home-network-filter';
import { useNetworkPillBalances } from './use-network-pill-balances';
import { NetworkPillSelector } from './network-pill-selector';

jest.mock(
  '../asset-list/asset-list-control-bar/use-home-network-filter',
  () => ({
    ...jest.requireActual(
      '../asset-list/asset-list-control-bar/use-home-network-filter',
    ),
    useHomeNetworkFilter: jest.fn(),
  }),
);
jest.mock('./use-network-pill-balances');

const ETHEREUM = {
  chainId: 'eip155:1',
  name: 'Ethereum',
  isEvm: true,
} as unknown as MultichainNetworkConfiguration;
const OPTIMISM = {
  chainId: 'eip155:10',
  name: 'Optimism',
  isEvm: true,
} as unknown as MultichainNetworkConfiguration;

const mockHandleSelectNetwork = jest.fn();
const mockHandleSelectAll = jest.fn();

const mockFilter = (overrides = {}) => {
  jest.mocked(useHomeNetworkFilter).mockReturnValue({
    defaultNetworks: [ETHEREUM, OPTIMISM],
    getDisabledTooltip: (disabled: boolean) =>
      disabled ? 'Not supported' : undefined,
    handleSelectAllDefaultNetworks: mockHandleSelectAll,
    handleSelectNetwork: mockHandleSelectNetwork,
    hasOnlyDefaultNetworks: false,
    isAllDefaultSelected: true,
    isNetworkDisabled: () => false,
    isNetworkSelected: () => false,
    isPending: false,
    ...overrides,
  } as unknown as ReturnType<typeof useHomeNetworkFilter>);
};

const renderSelector = () =>
  renderWithProvider(<NetworkPillSelector />, configureStore(mockState));

describe('NetworkPillSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFilter();
    jest.mocked(useNetworkPillBalances).mockReturnValue({
      balanceByChainId: { 'eip155:1': 8.17, 'eip155:10': 8.14 },
      total: 16.31,
      currency: 'usd',
    });
  });

  it('shows the default networks with their balances', () => {
    renderSelector();

    expect(screen.getByTestId('network-pill-all-default')).toHaveTextContent(
      '$16.31',
    );
    expect(screen.getByTestId('network-pill-0x1')).toHaveTextContent(
      'Ethereum$8.17',
    );
    expect(screen.getByTestId('network-pill-0xa')).toHaveTextContent(
      'Optimism$8.14',
    );
  });

  it('shows no balance while the balances are not available', () => {
    jest.mocked(useNetworkPillBalances).mockReturnValue({
      balanceByChainId: { 'eip155:1': undefined, 'eip155:10': undefined },
      total: undefined,
      currency: undefined,
    });

    renderSelector();

    expect(screen.getByTestId('network-pill-all-default')).toHaveTextContent(
      /^All default networks$/u,
    );
    expect(screen.getByTestId('network-pill-0x1')).toHaveTextContent(
      /^Ethereum$/u,
    );
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
  });

  it('selects a network or all default networks using the dropdown handlers', () => {
    renderSelector();

    fireEvent.click(screen.getByTestId('network-pill-0xa'));
    expect(mockHandleSelectNetwork).toHaveBeenCalledWith('eip155:10');

    fireEvent.click(screen.getByTestId('network-pill-all-default'));
    expect(mockHandleSelectAll).toHaveBeenCalledTimes(1);
  });

  it('marks the selected network and disables unsupported pills', () => {
    mockFilter({
      isAllDefaultSelected: false,
      isNetworkSelected: (network: MultichainNetworkConfiguration) =>
        network.chainId === 'eip155:1',
      isNetworkDisabled: (network: MultichainNetworkConfiguration) =>
        network.chainId === 'eip155:10',
    });

    renderSelector();

    expect(screen.getByTestId('network-pill-0x1')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByTestId('network-pill-0xa')).toBeDisabled();
  });

  describe('when pills wrap onto more than one line', () => {
    it('toggles between the collapsed and expanded view', () => {
      // The Optimism pill sits on a second line
      jest
        .spyOn(HTMLElement.prototype, 'offsetTop', 'get')
        .mockImplementation(function mock(this: HTMLElement) {
          return this.dataset.testid === 'network-pill-0xa' ? 56 : 0;
        });

      renderSelector();
      const toggle = screen.getByTestId('network-pill-toggle');
      expect(toggle).toHaveTextContent('Show 1 more networks');

      fireEvent.click(toggle);
      expect(toggle).toHaveTextContent('Show fewer networks');

      fireEvent.click(toggle);
      expect(toggle).toHaveTextContent('Show 1 more networks');
    });
  });

  it('hides the toggle when every pill fits on one line', () => {
    renderSelector();

    expect(screen.queryByTestId('network-pill-toggle')).not.toBeInTheDocument();
  });
});
