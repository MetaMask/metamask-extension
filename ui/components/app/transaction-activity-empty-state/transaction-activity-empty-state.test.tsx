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

const createAccount = (
  overrides: Partial<InternalAccount> = {},
): InternalAccount => ({
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
  ...overrides,
});

const mockAccount = createAccount();

const createStateOverrides = (
  metamaskOverrides: Record<string, unknown> = {},
) => ({
  metamask: {
    ...mockState.metamask,
    ...metamaskOverrides,
  },
});

const createTestnetState = (): ReturnType<typeof createStateOverrides> =>
  createStateOverrides({
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
  });

const createStateWithoutExternalServices = (): ReturnType<
  typeof createStateOverrides
> =>
  createStateOverrides({
    useExternalServices: false,
  });

const createValidSwapState = (): ReturnType<typeof createStateOverrides> =>
  createStateOverrides({
    useExternalServices: true,
    selectedNetworkClientId: 'testNetworkConfigurationId', // This points to mainnet in mock state
  });

const expectSwapButtonState = (enabled: boolean): HTMLElement => {
  const swapButton = screen.getByRole('button', { name: 'Swap tokens' });
  if (enabled) {
    expect(swapButton).not.toBeDisabled();
  } else {
    expect(swapButton).toBeDisabled();
  }
  return swapButton;
};

const setupMocks = (): {
  mockOpenBridgeExperience: jest.Mock;
  mockUseBridging: jest.MockedFunction<typeof useBridging>;
} => {
  const mockOpenBridgeExperience = jest.fn();
  const mockUseBridging = useBridging as jest.MockedFunction<
    typeof useBridging
  >;

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

  return { mockOpenBridgeExperience, mockUseBridging };
};

describe('TransactionActivityEmptyState', () => {
  const middleware = [thunk];
  let mockOpenBridgeExperience: jest.Mock;

  beforeEach(() => {
    ({ mockOpenBridgeExperience } = setupMocks());
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
    const { getByTestId } = renderComponent({ className: 'custom-class' });
    expect(getByTestId('activity-tab-empty-state')).toHaveClass('custom-class');
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
      {}, // no prop changes
      {
        metamask: { ...mockState.metamask, theme: ThemeType.dark },
      },
    );
    const image = screen.getByAltText('Activity');
    expect(image).toHaveAttribute(
      'src',
      './images/empty-state-activity-dark.png',
    );
  });

  describe('Swap button functionality', () => {
    const accountWithoutSigning = createAccount({
      methods: ['personal_sign'], // No eth_signTransaction or eth_signUserOperation
    });

    const accountWithSigning = createAccount({
      methods: [EthMethod.SignTransaction, 'personal_sign'],
    });

    // TODO: Our jest describe is typed as Mocha this should be fixed
    (describe as unknown as jest.Describe).each<
      [
        string,
        Partial<TransactionActivityEmptyStateProps>,
        ReturnType<typeof createStateOverrides> | Record<string, never>,
      ]
    >([
      [
        'not a swaps chain',
        { account: accountWithSigning },
        createTestnetState(),
      ],
      [
        'external services are disabled',
        { account: accountWithSigning },
        createStateWithoutExternalServices(),
      ],
      [
        'account cannot sign transactions',
        { account: accountWithoutSigning },
        {},
      ],
    ])(
      'disables swap button when %s',
      (
        _condition: string,
        props: Partial<TransactionActivityEmptyStateProps>,
        stateOverrides:
          | ReturnType<typeof createStateOverrides>
          | Record<string, never>,
      ) => {
        it(`should disable swap button`, () => {
          renderComponent(props, stateOverrides);
          expectSwapButtonState(false);
        });
      },
    );

    it('enables swap button when all conditions are met', () => {
      const props: Partial<TransactionActivityEmptyStateProps> = {
        account: accountWithSigning,
      };
      const stateOverrides = createValidSwapState();
      renderComponent(props, stateOverrides);
      expectSwapButtonState(true);
    });

    it('enables swap button for Solana networks even when isSwapsChain is false', () => {
      jest
        .spyOn(useMultichainSelectorHook, 'useMultichainSelector')
        .mockReturnValue({
          chainId: MultichainNetworks.SOLANA,
          isEvmNetwork: false,
        });
      const props: Partial<TransactionActivityEmptyStateProps> = {
        account: accountWithSigning,
      };
      const stateOverrides = createTestnetState();
      renderComponent(props, stateOverrides);
      expectSwapButtonState(true); // Should be enabled due to Solana logic
    });

    it('calls openBridgeExperience when swap button is clicked', () => {
      const props: Partial<TransactionActivityEmptyStateProps> = {
        account: accountWithSigning,
      };
      const stateOverrides = createValidSwapState();
      renderComponent(props, stateOverrides);
      const swapButton = expectSwapButtonState(true);

      fireEvent.click(swapButton);
      expect(mockOpenBridgeExperience).toHaveBeenCalledWith(
        'Activity Tab Empty State',
        undefined, // No specific token
      );
    });
  });
});
