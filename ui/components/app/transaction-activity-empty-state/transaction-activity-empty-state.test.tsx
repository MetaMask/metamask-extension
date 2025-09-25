import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { EthMethod } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../test/jest';
import mockState from '../../../../test/data/mock-state.json';
import { ThemeType } from '../../../../shared/constants/preferences';
import useBridging from '../../../hooks/bridge/useBridging';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import * as useMultichainSelectorHook from '../../../hooks/useMultichainSelector';
import {
  TransactionActivityEmptyState,
  type TransactionActivityEmptyStateProps,
} from './transaction-activity-empty-state';

// Mock the useBridging hook
jest.mock('../../../hooks/bridge/useBridging');

const mockAccount: InternalAccount = {
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  type: 'eip155:eoa',
  options: {},
  scopes: ['eip155:1'],
  methods: [
    'personal_sign',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  metadata: {
    name: 'Account 1',
    keyring: { type: 'HD Key Tree' },
    importTime: Date.now(),
  },
};

describe('TransactionActivityEmptyState', () => {
  const middleware = [thunk];
  const mockOpenBridgeExperience = jest.fn();
  const mockUseBridging = useBridging as jest.MockedFunction<
    typeof useBridging
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBridging.mockReturnValue({
      openBridgeExperience: mockOpenBridgeExperience,
    });

    // Mock useMultichainSelector to return EVM network by default
    jest
      .spyOn(useMultichainSelectorHook, 'useMultichainSelector')
      .mockReturnValue({
        chainId: '0x1', // Default to mainnet (EVM)
        isEvmNetwork: true,
      });
  });

  const renderComponent = (
    props: Partial<TransactionActivityEmptyStateProps> = {},
    stateOverrides = {},
  ) => {
    const store = configureMockStore(middleware)({
      ...mockState,
      ...stateOverrides,
    });

    return renderWithProvider(
      <TransactionActivityEmptyState account={mockAccount} {...props} />,
      store,
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByTestId('activity-tab-empty-state')).toBeInTheDocument();
  });

  it('renders description text', () => {
    renderComponent();
    expect(
      screen.getByText('Nothing to see yet. Swap your first token today.'),
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderComponent({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders light theme image by default', () => {
    renderComponent();
    const image = screen.getByAltText('Activity');
    expect(image).toHaveAttribute(
      'src',
      './images/empty-state-activity-light.png',
    );
  });

  it('renders dark theme image when dark theme is selected', () => {
    renderComponent(
      {},
      { metamask: { ...mockState.metamask, theme: ThemeType.dark } },
    );
    const image = screen.getByAltText('Activity');
    expect(image).toHaveAttribute(
      'src',
      './images/empty-state-activity-dark.png',
    );
  });

  describe('Swap button functionality', () => {
    const accountWithoutSigning: InternalAccount = {
      ...mockAccount,
      methods: ['personal_sign'], // No eth_signTransaction or eth_signUserOperation
    };

    const accountWithSigning: InternalAccount = {
      ...mockAccount,
      methods: [EthMethod.SignTransaction, 'personal_sign'],
    };

    it('disables swap button when not a swaps chain', () => {
      // Override state to simulate testnet (non-swaps chain)
      const testnetState = {
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          selectedNetworkClientId: 'goerli',
          networkConfigurationsByChainId: {
            ...mockState.metamask.networkConfigurationsByChainId,
            '0x5': {
              // Goerli testnet - not in allowed swaps chains
              chainId: '0x5',
              name: 'Goerli',
              nativeCurrency: 'ETH',
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                {
                  type: 'infura',
                  url: 'https://goerli.infura.io/v3/test',
                  networkClientId: 'goerli',
                },
              ],
              blockExplorerUrls: [],
            },
          },
        },
      };

      renderComponent({ account: accountWithSigning }, testnetState);
      const swapButton = screen.getByRole('button', { name: 'Swap tokens' });
      expect(swapButton).toBeDisabled();
    });

    it('disables swap button when external services are disabled', () => {
      const stateWithoutExternalServices = {
        metamask: {
          ...mockState.metamask,
          useExternalServices: false,
        },
      };

      renderComponent(
        { account: accountWithSigning },
        stateWithoutExternalServices,
      );
      const swapButton = screen.getByRole('button', { name: 'Swap tokens' });
      expect(swapButton).toBeDisabled();
    });

    it('disables swap button when account cannot sign transactions', () => {
      renderComponent({ account: accountWithoutSigning });
      const swapButton = screen.getByRole('button', { name: 'Swap tokens' });
      expect(swapButton).toBeDisabled();
    });

    it('enables swap button when all conditions are met', () => {
      const validState = {
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          selectedNetworkClientId: 'testNetworkConfigurationId', // This points to mainnet in mock state
        },
      };

      renderComponent({ account: accountWithSigning }, validState);
      const swapButton = screen.getByRole('button', { name: 'Swap tokens' });
      expect(swapButton).not.toBeDisabled();
    });

    it('enables swap button for Solana networks even when isSwapsChain is false', () => {
      // Mock multichain selector to return Solana
      jest
        .spyOn(useMultichainSelectorHook, 'useMultichainSelector')
        .mockReturnValue({
          chainId: MultichainNetworks.SOLANA,
          isEvmNetwork: false,
        });

      const testnetState = {
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          selectedNetworkClientId: 'goerli', // This makes isSwapsChain false
        },
      };

      renderComponent({ account: accountWithSigning }, testnetState);
      const swapButton = screen.getByRole('button', { name: 'Swap tokens' });
      expect(swapButton).not.toBeDisabled(); // Should be enabled due to Solana logic
    });

    it('calls openBridgeExperience when swap button is clicked', () => {
      const validState = {
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          selectedNetworkClientId: 'testNetworkConfigurationId', // This points to mainnet in mock state
        },
      };

      renderComponent({ account: accountWithSigning }, validState);
      const swapButton = screen.getByRole('button', { name: 'Swap tokens' });

      fireEvent.click(swapButton);

      expect(mockOpenBridgeExperience).toHaveBeenCalledWith(
        'Activity Tab Empty State',
        undefined, // No specific token
        true, // isSwap = true
      );
    });
  });
});
