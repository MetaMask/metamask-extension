import React from 'react';
import { act } from '@testing-library/react';
import * as reactRouterUtils from 'react-router-dom-v5-compat';
import * as ReactReduxModule from 'react-redux';
import { userEvent } from '@testing-library/user-event';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { renderHook } from '@testing-library/react-hooks';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createTestProviderTools } from '../../../../test/stub/provider';
import * as SelectorsModule from '../../../selectors/multichain/networks';
import * as ActionsModule from '../../../store/actions';
import PrepareBridgePage, {
  useEnableMissingNetwork,
} from './prepare-bridge-page';

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
    const mockSetEnabledNetworks = jest.spyOn(
      ActionsModule,
      'setEnabledNetworks',
    );

    return {
      mockGetEnabledNetworksByNamespace,
      mockSetEnabledNetworks,
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
    expect(mocks.mockSetEnabledNetworks).toHaveBeenCalledWith(
      ['0x1', '0xe708'],
      'eip155',
    );
  });

  it('does not enable popular network if already enabled', () => {
    const mocks = arrange();
    const hook = renderHook(() => useEnableMissingNetwork());

    // Act - enable 0x1 (already enabled)
    hook.result.current('0x1');
    expect(mocks.mockSetEnabledNetworks).not.toHaveBeenCalled();
  });

  it('does not enable non-popular network', () => {
    const mocks = arrange();
    const hook = renderHook(() => useEnableMissingNetwork());

    hook.result.current('0x1111'); // not popular network
    expect(mocks.mockSetEnabledNetworks).not.toHaveBeenCalled();
  });
});
