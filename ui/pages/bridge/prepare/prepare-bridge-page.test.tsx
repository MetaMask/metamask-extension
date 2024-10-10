import React from 'react';
import { act } from '@testing-library/react';
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

  it('should render the component, with initial state', async () => {
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
});
