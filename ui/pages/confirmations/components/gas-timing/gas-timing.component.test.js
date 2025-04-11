import { waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';

import GasTiming from '.';
import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

jest.mock('../../../../store/actions.ts', () => ({
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
}));

describe('Gas timing', () => {
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
      expect(screen.queryByText('🦊 Market')).toBeInTheDocument();
      expect(screen.getByTestId('gas-timing-time')).toBeInTheDocument();
    });
  });
});
