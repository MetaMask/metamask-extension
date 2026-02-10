import React from 'react';
import configureMockStore from 'redux-mock-store';
import { waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';

import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import mockState from '../../../../../test/data/mock-state.json';
import { useGasFeeContext } from '../../../../contexts/gasFee';

import { CHAIN_IDS } from '../../../../../shared/constants/network';
import GasTiming from '.';

jest.mock('../../../../store/actions.ts', () => ({
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('../../../../contexts/gasFee.js', () => ({
  useGasFeeContext: jest.fn().mockImplementation(() => ({
    estimateUsed: 'medium',
  })),
}));

describe('Gas timing', () => {
  afterEach(jest.clearAllMocks);

  it('renders nothing when gas is loading', () => {
    // Fails the networkAndAccountSupports1559 check
    const nullGasState = {
      metamask: {
        gasFeeEstimates: null,
        gasEstimateType: GasEstimateTypes.feeMarket,
      },
    };

    const mockStore = configureMockStore()(nullGasState);

    const { container } = renderWithProvider(<GasTiming />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('renders gas timing time when high estimate is chosen', async () => {
    const mockStore = configureMockStore()(mockState);

    const props = {
      maxPriorityFeePerGas: '1000000',
    };

    const screen = renderWithProvider(<GasTiming {...props} />, mockStore);

    await waitFor(() => {
      expect(screen.queryByText('Market')).toBeTruthy();
      expect(screen.getByTestId('gas-timing-time')).toBeInTheDocument();
    });
  });

  it('renders "⬆ 10% increase" when the estimate is tenPercentIncreased', async () => {
    useGasFeeContext.mockReturnValue({
      estimateUsed: 'tenPercentIncreased',
    });

    const mockStore = configureMockStore()(mockState);
    const props = {
      maxPriorityFeePerGas: '1000000',
    };

    const screen = renderWithProvider(<GasTiming {...props} />, mockStore);

    await waitFor(() => {
      expect(screen.queryByText('10% increase')).toBeTruthy();
    });
  });

  it('renders "<1 sec" when the chain is fast and estimate time is low', async () => {
    useGasFeeContext.mockReturnValue({
      estimateUsed: 'high',
    });

    const fastChainState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        gasFeeEstimates: {
          ...mockState.metamask.gasFeeEstimates,
          high: {
            ...mockState.metamask.gasFeeEstimates.high,
            minWaitTimeEstimate: 250,
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
      },
    };

    const mockStore = configureMockStore()(fastChainState);
    const screen = renderWithProvider(
      <GasTiming
        chainId={CHAIN_IDS.MEGAETH_MAINNET}
        maxPriorityFeePerGas="10"
      />,
      mockStore,
    );

    await waitFor(() => {
      expect(screen.getByTestId('gas-timing-time')).toHaveTextContent('<1 sec');
    });
  });

  it('renders "~0 sec" instead of "<0 sec" when minWaitTimeEstimate is 0', async () => {
    useGasFeeContext.mockReturnValue({
      estimateUsed: 'high',
    });

    const zeroTimeState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        gasFeeEstimates: {
          ...mockState.metamask.gasFeeEstimates,
          high: {
            ...mockState.metamask.gasFeeEstimates.high,
            minWaitTimeEstimate: 0,
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
      },
    };

    const mockStore = configureMockStore()(zeroTimeState);
    const screen = renderWithProvider(
      <GasTiming maxPriorityFeePerGas="10" />,
      mockStore,
    );

    await waitFor(() => {
      expect(screen.getByTestId('gas-timing-time')).toHaveTextContent('~0 sec');
    });
  });

  it('renders "<1 sec" for Ethereum mainnet', async () => {
    useGasFeeContext.mockReturnValue({
      estimateUsed: 'high',
    });

    const ethereumState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        gasFeeEstimates: {
          ...mockState.metamask.gasFeeEstimates,
          high: {
            ...mockState.metamask.gasFeeEstimates.high,
            minWaitTimeEstimate: 250,
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
      },
    };

    const mockStore = configureMockStore()(ethereumState);
    const screen = renderWithProvider(
      <GasTiming chainId={CHAIN_IDS.MAINNET} maxPriorityFeePerGas="10" />,
      mockStore,
    );

    await waitFor(() => {
      expect(screen.getByTestId('gas-timing-time')).toHaveTextContent('<1 sec');
    });
  });
});
