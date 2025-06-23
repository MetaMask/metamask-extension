import React from 'react';
import configureMockStore from 'redux-mock-store';
import { waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import mockState from '../../../../../test/data/mock-state.json';
import { useGasFeeContext } from '../../../../contexts/gasFee';

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
      send: { draftTransactions: {} },
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
      expect(screen.queryByText('🦊 Market')).toBeTruthy();
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
      expect(screen.queryByText('⬆ 10% increase')).toBeTruthy();
    });
  });
});
