import React from 'react';
import { act } from '@testing-library/react';
import * as reactRouterUtils from 'react-router-dom-v5-compat';
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.ethereumProvider = provider as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component, with initial state', async () => {
    jest
      .spyOn(reactRouterUtils, 'useSearchParams')
      .mockReturnValue([{ get: () => null }] as never);
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.OPTIMISM],
      },
      {},
    );
    const { container, getByRole, getByTestId } = renderWithProvider(
      <PrepareBridgePage />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByRole('button', { name: /ETH/u })).toBeInTheDocument();
    expect(getByRole('button', { name: /Select token/u })).toBeInTheDocument();

    expect(getByTestId('from-amount')).toBeInTheDocument();
    expect(getByTestId('from-amount').closest('input')).not.toBeDisabled();
    await act(() => {
      fireEvent.change(getByTestId('from-amount'), { target: { value: '2' } });
    });
    expect(getByTestId('from-amount').closest('input')).toHaveValue(2);

    expect(getByTestId('to-amount')).toBeInTheDocument();
    expect(getByTestId('to-amount').closest('input')).toBeDisabled();

    expect(getByTestId('switch-tokens').closest('button')).toBeDisabled();
  });

  it('should render the component, with inputs set', async () => {
    jest
      .spyOn(reactRouterUtils, 'useSearchParams')
      .mockReturnValue([{ get: () => '0x3103910' }, jest.fn()] as never);
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.LINEA_MAINNET],
        destNetworkAllowlist: [CHAIN_IDS.LINEA_MAINNET],
        destTokens: {
          '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
            iconUrl: 'http://url',
            symbol: 'UNI',
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            decimals: 6,
          },
        },
      },
      {
        fromTokenInputValue: '1',
        fromToken: { address: '0x3103910', decimals: 6 },
        toToken: {
          iconUrl: 'http://url',
          symbol: 'UNI',
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          decimals: 6,
        },
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      {
        quoteRequest: {
          srcTokenAddress: '0x3103910',
          destTokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          srcChainId: 1,
          destChainId: 10,
          walletAddress: '0x123',
          slippage: 0.5,
        },
      },
    );
    const { container, getByRole, getByTestId } = renderWithProvider(
      <PrepareBridgePage />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByRole('button', { name: /ETH/u })).toBeInTheDocument();
    expect(getByRole('button', { name: /UNI/u })).toBeInTheDocument();

    expect(getByTestId('from-amount')).toBeInTheDocument();
    expect(getByTestId('from-amount').closest('input')).not.toBeDisabled();
    expect(getByTestId('from-amount').closest('input')).toHaveValue(1);

    await act(() => {
      fireEvent.change(getByTestId('from-amount'), { target: { value: '2' } });
    });
    expect(getByTestId('from-amount').closest('input')).toHaveValue(2);

    expect(getByTestId('to-amount')).toBeInTheDocument();
    expect(getByTestId('to-amount').closest('input')).toBeDisabled();

    expect(getByTestId('switch-tokens').closest('button')).not.toBeDisabled();
  });

  it('should throw an error if token decimals are not defined', async () => {
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.LINEA_MAINNET],
        destNetworkAllowlist: [CHAIN_IDS.LINEA_MAINNET],
      },
      {
        fromTokenInputValue: 1,
        fromToken: { address: '0x3103910' },
        toToken: {
          iconUrl: 'http://url',
          symbol: 'UNI',
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        },
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      {},
    );

    expect(() =>
      renderWithProvider(<PrepareBridgePage />, configureStore(mockStore)),
    ).toThrow();
  });
});
