import React from 'react';
import { act } from '@testing-library/react';
import * as reactRouterUtils from 'react-router-dom-v5-compat';
import * as ReactReduxModule from 'react-redux';
import { userEvent } from '@testing-library/user-event';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { renderHook } from '@testing-library/react-hooks';
import { Hex } from '@metamask/utils';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createTestProviderTools } from '../../../../test/stub/provider';
import { mockNetworkState } from '../../../../test/stub/networks';
import * as SelectorsModule from '../../../selectors/multichain/networks';
import * as NetworkOrderControllerActionsModule from '../../../store/controller-actions/network-order-controller';
import PrepareBridgePage, {
  useEnableMissingNetwork,
} from './prepare-bridge-page';

// Mock the isSendBundleSupported function
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  isSendBundleSupported: jest.fn(),
}));

// Mock the useGasIncluded7702 hook
jest.mock('../hooks/useGasIncluded7702', () => ({
  useGasIncluded7702: jest.fn().mockReturnValue(false),
}));

describe('PrepareBridgePage', () => {
  beforeAll(() => {
    const { provider } = createTestProviderTools({
      networkId: 'Ethereum',
      chainId: CHAIN_IDS.MAINNET,
    });

    global.ethereumProvider = provider;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component, with initial state', async () => {
    jest
      .spyOn(reactRouterUtils, 'useSearchParams')
      .mockReturnValue([{ get: () => null }] as never);
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: false,
            },
            [CHAIN_IDS.OPTIMISM]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
      metamaskStateOverrides: {
        completedOnboarding: true,
        allDetectedTokens: {
          '0x1': {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
              {
                address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
                decimals: 6,
              }, // USDC
            ],
          },
        },
      },
    });
    const { container, getByRole, getByTestId } = renderWithProvider(
      <PrepareBridgePage />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByRole('button', { name: /ETH/u })).toBeInTheDocument();

    expect(getByTestId('from-amount')).toBeInTheDocument();
    expect(getByTestId('from-amount').closest('input')).not.toBeDisabled();
    await act(() => {
      fireEvent.change(getByTestId('from-amount'), { target: { value: '2' } });
    });
    expect(getByTestId('from-amount').closest('input')).toHaveValue('2');

    expect(getByTestId('to-amount')).toBeInTheDocument();
    expect(getByTestId('to-amount').closest('input')).toBeDisabled();

    expect(getByTestId('switch-tokens').closest('button')).toBeDisabled();
  });

  it('should render the component, with inputs set', async () => {
    jest
      .spyOn(reactRouterUtils, 'useSearchParams')
      .mockReturnValue([{ get: () => '0x3103910' }, jest.fn()] as never);
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          support: true,
          chains: {
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: false,
            },
            [CHAIN_IDS.LINEA_MAINNET]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
        destTokens: {
          '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
            iconUrl: 'http://url',
            symbol: 'UNI',
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            decimals: 6,
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        fromToken: {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          decimals: 6,
          chainId: CHAIN_IDS.MAINNET,
        },
        toToken: {
          iconUrl: 'http://url',
          symbol: 'UNI',
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          decimals: 6,
        },
        toChainId: toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET),
      },
      bridgeStateOverrides: {
        quoteRequest: {
          srcTokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          destTokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          srcChainId: 1,
          destChainId: 10,
          walletAddress: '0x123',
          slippage: 0.5,
        },
      },
    });
    const { container, getByRole, getByTestId } = renderWithProvider(
      <PrepareBridgePage />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByRole('button', { name: /ETH/u })).toBeInTheDocument();
    expect(getByRole('button', { name: /USDC/u })).toBeInTheDocument();

    expect(getByTestId('from-amount')).toBeInTheDocument();
    expect(getByTestId('from-amount').closest('input')).not.toBeDisabled();

    await act(() => {
      fireEvent.change(getByTestId('from-amount'), { target: { value: '1' } });
    });
    expect(getByTestId('from-amount').closest('input')).toHaveValue('1');

    await act(() => {
      fireEvent.change(getByTestId('from-amount'), { target: { value: '2' } });
    });
    expect(getByTestId('from-amount').closest('input')).toHaveValue('2');

    expect(getByTestId('to-amount')).toBeInTheDocument();
    expect(getByTestId('to-amount').closest('input')).toBeDisabled();

    expect(getByTestId('switch-tokens').closest('button')).toBeDisabled();
  });

  it('should throw an error if token decimals are not defined', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: false,
            },
            [CHAIN_IDS.LINEA_MAINNET]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: 1,
        fromToken: { address: '0x3103910' },
        toToken: {
          iconUrl: 'http://url',
          symbol: 'UNI',
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          decimals: 6,
        },
        toChainId: toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET),
      },
    });

    expect(() =>
      renderWithProvider(<PrepareBridgePage />, configureStore(mockStore)),
    ).toThrow();
  });

  it('should validate src amount on change', async () => {
    jest
      .spyOn(reactRouterUtils, 'useSearchParams')
      .mockReturnValue([{ get: () => null }] as never);
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: false,
            },
          },
        },
      },
    });
    const { getByTestId } = renderWithProvider(
      <PrepareBridgePage />,
      configureStore(mockStore),
    );

    expect(getByTestId('from-amount').closest('input')).not.toBeDisabled();

    act(() => {
      fireEvent.change(getByTestId('from-amount'), {
        target: { value: '2abc.123456123456123456' },
      });
    });
    expect(getByTestId('from-amount').closest('input')).toHaveValue(
      '2.123456123456123456',
    );

    act(() => {
      fireEvent.change(getByTestId('from-amount'), {
        target: { value: '2abc,131.1212' },
      });
    });
    expect(getByTestId('from-amount').closest('input')).toHaveValue(
      '2131.1212',
    );

    act(() => {
      fireEvent.change(getByTestId('from-amount'), {
        target: { value: '2abc,131.123456123456123456123456' },
      });
    });
    expect(getByTestId('from-amount').closest('input')).toHaveValue(
      '2131.123456123456123456123456',
    );

    act(() => {
      fireEvent.change(getByTestId('from-amount'), {
        target: { value: '2abc.131.123456123456123456123456' },
      });
    });
    expect(getByTestId('from-amount').closest('input')).toHaveValue('2.131');

    userEvent.paste('2abc.131.123456123456123456123456');
    expect(getByTestId('from-amount').closest('input')).toHaveValue('2.131');
  });
});

describe('useEnableMissingNetwork', () => {
  const arrangeReactReduxMocks = () => {
    jest
      .spyOn(ReactReduxModule, 'useSelector')
      .mockImplementation((selector) => selector({}));
    jest.spyOn(ReactReduxModule, 'useDispatch').mockReturnValue(jest.fn());
  };

  const arrange = () => {
    arrangeReactReduxMocks();

    const mockGetEnabledNetworksByNamespace = jest
      .spyOn(SelectorsModule, 'getEnabledNetworksByNamespace')
      .mockReturnValue({
        '0x1': true,
        '0xe708': true,
      });
    const mockEnableAllPopularNetworks = jest.spyOn(
      NetworkOrderControllerActionsModule,
      'enableAllPopularNetworks',
    );

    return {
      mockGetEnabledNetworksByNamespace,
      mockEnableAllPopularNetworks,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enables popular network when not already enabled', () => {
    const mocks = arrange();
    mocks.mockGetEnabledNetworksByNamespace.mockReturnValue({ '0xe708': true }); // Missing 0x1.
    const hook = renderHook(() => useEnableMissingNetwork());

    // Act - enable 0x1
    hook.result.current('0x1');

    // Assert - Adds 0x1 to enabled networks
    expect(mocks.mockEnableAllPopularNetworks).toHaveBeenCalledWith();
  });

  it('does not enable popular network if already enabled', () => {
    const mocks = arrange();
    const hook = renderHook(() => useEnableMissingNetwork());

    // Act - enable 0x1 (already enabled)
    hook.result.current('0x1');
    expect(mocks.mockEnableAllPopularNetworks).not.toHaveBeenCalled();
  });

  it('does not enable non-popular network', () => {
    const mocks = arrange();
    const hook = renderHook(() => useEnableMissingNetwork());

    hook.result.current('0x1111'); // not popular network
    expect(mocks.mockEnableAllPopularNetworks).not.toHaveBeenCalled();
  });
});

describe('PrepareBridgePage - Race Conditions', () => {
  const mockIsSendBundleSupported = jest.requireMock(
    '../../../store/actions',
  ).isSendBundleSupported;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock to a default resolved value
    mockIsSendBundleSupported.mockResolvedValue(false);
  });

  it('handles isSendBundleSupported race conditions correctly', async () => {
    // Test that rapid chain changes don't cause race conditions
    const chainIds: Hex[] = ['0x1', '0x89', '0xa'];

    // Mock different responses for different chains
    mockIsSendBundleSupported.mockImplementation((chainId: string) => {
      const delays: Record<string, number> = {
        '0x1': 100,
        '0x89': 50,
        '0xa': 10,
      };
      return new Promise((resolve) => {
        setTimeout(
          () => {
            resolve(chainId === '0x1'); // Only mainnet supports bundles
          },
          delays[chainId as string] || 0,
        );
      });
    });

    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: chainIds[0] }),
      },
      bridgeStateOverrides: {
        srcTokens: { '0x00': {} },
        srcTopAssets: [],
        quoteRequest: {
          srcChainId: chainIds[0],
        },
      },
    });

    const { rerender } = renderWithProvider(
      <PrepareBridgePage />,
      configureStore(mockStore),
    );

    // Simulate rapid chain changes
    for (const chainId of chainIds) {
      const newStore = createBridgeMockStore({
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId }),
        },
        bridgeStateOverrides: {
          srcTokens: { '0x00': {} },
          srcTopAssets: [],
          quoteRequest: {
            srcChainId: chainId,
          },
        },
      });

      rerender(
        <ReactReduxModule.Provider store={configureStore(newStore)}>
          <PrepareBridgePage />
        </ReactReduxModule.Provider>,
      );
    }

    // Wait for all async operations to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Should have called the function for each chain
    expect(mockIsSendBundleSupported).toHaveBeenCalledWith('0x1');
    expect(mockIsSendBundleSupported).toHaveBeenCalledWith('0x89');
    expect(mockIsSendBundleSupported).toHaveBeenCalledWith('0xa');
  });

  it('handles isSendBundleSupported errors gracefully', async () => {
    const testError = new Error('Network error');
    mockIsSendBundleSupported.mockRejectedValue(testError);

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const mockStore = createBridgeMockStore({
      bridgeStateOverrides: {
        srcTokens: { '0x00': {} },
        srcTopAssets: [],
        quoteRequest: {
          srcChainId: '0x1',
        },
      },
    });

    const { container } = renderWithProvider(
      <PrepareBridgePage />,
      configureStore(mockStore),
    );

    // Wait for async operations
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Should have logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error checking send bundle support:',
      testError,
    );

    // Component should still render
    expect(container).toBeTruthy();

    consoleErrorSpy.mockRestore();
  });

  it('handles component unmount during async operations', async () => {
    // Create a promise that we can control
    let resolveSendBundle: (value: boolean) => void;
    const sendBundlePromise = new Promise<boolean>((resolve) => {
      resolveSendBundle = resolve;
    });

    mockIsSendBundleSupported.mockReturnValue(sendBundlePromise);

    const mockStore = createBridgeMockStore({
      bridgeStateOverrides: {
        srcTokens: { '0x00': {} },
        srcTopAssets: [],
        quoteRequest: {
          srcChainId: '0x1',
        },
      },
    });

    const { unmount } = renderWithProvider(
      <PrepareBridgePage />,
      configureStore(mockStore),
    );

    // Unmount before the promise resolves
    unmount();

    // Now resolve the promise
    await act(async () => {
      if (resolveSendBundle) {
        resolveSendBundle(true);
      }
      await Promise.resolve();
    });

    // No errors should be thrown
    // This test passes if no errors occur
  });
});
