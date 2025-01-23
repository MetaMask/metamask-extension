import React from 'react';
import { act } from '@testing-library/react';
import * as reactRouterUtils from 'react-router-dom-v5-compat';
import { zeroAddress } from 'ethereumjs-util';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createTestProviderTools } from '../../../../test/stub/provider';
import PrepareBridgePage from './prepare-bridge-page';

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
      bridgeStateOverrides: {
        srcTokens: {
          '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2': {
            address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
          }, // UNI,
          [zeroAddress()]: { address: zeroAddress() },
          '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            decimals: 6,
          }, // USDC
        },
        srcTopAssets: [
          { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
        ],
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
        toChainId: CHAIN_IDS.LINEA_MAINNET,
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
    expect(getByRole('button', { name: /Bridge to/u })).toBeInTheDocument();

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
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
    });

    expect(() =>
      renderWithProvider(<PrepareBridgePage />, configureStore(mockStore)),
    ).toThrow();
  });
});
