import React from 'react';
import type { Provider } from '@metamask/network-controller';
import { act } from '@testing-library/react';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import * as reactRouterUtils from 'react-router-dom';
import { userEvent } from '@testing-library/user-event';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createTestProviderTools } from '../../../../test/stub/provider';
import PrepareBridgePage from './prepare-bridge-page';

// Mock the bridge hooks
jest.mock('../hooks/useGasIncluded7702', () => ({
  useGasIncluded7702: jest.fn().mockReturnValue(false),
}));

jest.mock('../hooks/useIsSendBundleSupported', () => ({
  useIsSendBundleSupported: jest.fn().mockReturnValue(false),
}));

describe('PrepareBridgePage', () => {
  beforeAll(() => {
    const { provider } = createTestProviderTools({
      networkId: 'Ethereum',
      chainId: CHAIN_IDS.MAINNET,
    });

    global.ethereumProvider = provider as unknown as Provider;
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
        bridgeConfig: {
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
      <PrepareBridgePage onOpenSettings={jest.fn()} />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByRole('button', { name: /ETH/u })).toBeInTheDocument();

    const input = getByTestId('from-amount');
    expect(input).toBeInTheDocument();
    expect(input.closest('input')).not.toBeDisabled();
    await act(async () => {
      input.focus();
      await userEvent.clear(input);
      await userEvent.keyboard('2');
    });
    expect(input).toHaveDisplayValue('2');

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
        bridgeConfig: {
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
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        fromToken: {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          decimals: 6,
          chainId: CHAIN_IDS.MAINNET,
          assetId: toAssetId(
            '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            formatChainIdToCaip(CHAIN_IDS.MAINNET),
          ),
        },
        toToken: {
          iconUrl: 'http://url',
          symbol: 'UNI',
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          decimals: 6,
          chainId: CHAIN_IDS.LINEA_MAINNET,
          assetId: toAssetId(
            '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
          ),
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
      <PrepareBridgePage onOpenSettings={jest.fn()} />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByRole('button', { name: /ETH/u })).toBeInTheDocument();
    expect(getByRole('button', { name: /mUSD/u })).toBeInTheDocument();

    expect(getByTestId('from-amount')).toBeInTheDocument();
    expect(getByTestId('from-amount').closest('input')).not.toBeDisabled();

    const input = getByTestId('from-amount');
    await act(async () => {
      input.focus();
      await userEvent.clear(input);
      await userEvent.keyboard('1');
    });
    expect(input).toHaveDisplayValue('1');

    await act(async () => {
      input.focus();
      await userEvent.clear(input);
      await userEvent.keyboard('2');
    });
    expect(input).toHaveDisplayValue('2');

    expect(getByTestId('to-amount')).toBeInTheDocument();
    expect(getByTestId('to-amount').closest('input')).toBeDisabled();

    expect(getByTestId('switch-tokens').closest('button')).toBeDisabled();
  });

  it('should throw an error if token decimals are not defined', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
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
      renderWithProvider(
        <PrepareBridgePage onOpenSettings={jest.fn()} />,
        configureStore(mockStore),
      ),
    ).toThrow();
  });

  it('should validate src amount on change', async () => {
    jest
      .spyOn(reactRouterUtils, 'useSearchParams')
      .mockReturnValue([{ get: () => null }] as never);
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
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
      <PrepareBridgePage onOpenSettings={jest.fn()} />,
      configureStore(mockStore),
    );

    expect(getByTestId('from-amount').closest('input')).not.toBeDisabled();

    const input = getByTestId('from-amount');
    await act(async () => {
      input.focus();
      await userEvent.clear(input);
      for (const char of '2abc.123456123456123456') {
        await userEvent.keyboard(char);
      }
    });
    expect(input).toHaveDisplayValue('2.123456123456123456');

    await act(async () => {
      input.focus();
      await userEvent.clear(input);
      for (const char of '2abc,131.1212') {
        await userEvent.keyboard(char);
      }
    });
    expect(input).toHaveDisplayValue('2131.1212');

    await act(async () => {
      input.focus();
      await userEvent.clear(input);
      for (const char of '2abc,131.123456123456123456123456') {
        await userEvent.keyboard(char);
      }
    });
    expect(input).toHaveDisplayValue('2131.123456123456123456123456');

    await act(async () => {
      input.focus();
      await userEvent.clear(input);
      await userEvent.paste('2abc,131.123456123456123456123456');
    });
    expect(input).toHaveDisplayValue('2131.123456123456123456123456');

    await act(async () => {
      input.focus();
      await userEvent.clear(input);
      for (const char of '2abc.131.123456123456123456123456') {
        await userEvent.keyboard(char);
      }
    });
    expect(input).toHaveDisplayValue('2.131123456123456123456123456');

    await act(async () => {
      input.focus();
      await userEvent.clear(input);
      await userEvent.paste('2abc.131.123456123456123456123456');
    });
    expect(input).toHaveDisplayValue('2.131');
  });
});
