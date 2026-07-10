/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { type RampsToken } from '@metamask/ramps-controller';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { RampsTokenSelectionScreen } from './token-selection';

const mockNavigate = jest.fn();
const mockSetSelectedToken = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../../shared/lib/selectors/networks', () => ({
  ...jest.requireActual('../../../../../shared/lib/selectors/networks'),
  getAllNetworkConfigurationsByCaipChainId: jest.fn(() => ({
    'eip155:1': { chainId: 'eip155:1', name: 'Ethereum Mainnet' },
  })),
}));

const mockTopTokens: RampsToken[] = [
  {
    assetId: 'eip155:1/slip44:60',
    chainId: 'eip155:1',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    iconUrl: 'https://example.com/eth.png',
    tokenSupported: true,
  },
];

const mockAllTokens: RampsToken[] = [
  ...mockTopTokens,
  {
    assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    chainId: 'eip155:1',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    iconUrl: 'https://example.com/usdc.png',
    tokenSupported: true,
  },
];

jest.mock('../../../../hooks/ramps/useRampsController', () => ({
  useRampsController: jest.fn(),
}));

const { useRampsController } = jest.requireMock(
  '../../../../hooks/ramps/useRampsController',
);

const createStore = () =>
  configureStore({
    metamask: {
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      },
    },
  });

describe('RampsTokenSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRampsController.mockReturnValue({
      tokens: { topTokens: mockTopTokens, allTokens: mockAllTokens },
      tokensLoading: false,
      tokensError: null,
      setSelectedToken: mockSetSelectedToken,
    });
  });

  it('matches snapshot with top tokens', () => {
    const { container } = renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    expect(container).toMatchSnapshot();
  });

  it('handles expand, select, and navigation', () => {
    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    fireEvent.click(screen.getByTestId('ramps-show-all-tokens'));
    fireEvent.click(
      screen.getByTestId('ramps-token-list-item-eip155:1/slip44:60'),
    );

    expect(mockSetSelectedToken).toHaveBeenCalledWith('eip155:1/slip44:60');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
