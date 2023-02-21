import React from 'react';
import configureMockStore from 'redux-mock-store';
import { waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import { GasEstimateTypes } from '../../../../shared/constants/gas';
import mockState from '../../../../test/data/mock-state.json';

import GasTiming from '.';

jest.mock('../../../store/actions.ts', () => ({
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
}));

describe('Gas timing', () => {
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

  it('renders "very likely" when high estimate is chosen', async () => {
    const mockStore = configureMockStore()(mockState);

    const props = {
      maxPriorityFeePerGas: '10',
    };

    const { queryByText } = renderWithProvider(
      <GasTiming {...props} />,
      mockStore,
    );

    await waitFor(() => {
      expect(queryByText(/Very likely in/u)).toBeInTheDocument();
    });
  });

  it('renders "likely" when medium estimate is chosen', async () => {
    const mockStore = configureMockStore()(mockState);

    const props = {
      maxPriorityFeePerGas: '8',
    };

    const { queryByText } = renderWithProvider(
      <GasTiming {...props} />,
      mockStore,
    );

    await waitFor(() => {
      expect(queryByText(/Likely in/u)).toBeInTheDocument();
    });
  });

  it('renders "maybe" when low estimate is chosen', async () => {
    const mockStore = configureMockStore()(mockState);

    const props = {
      maxPriorityFeePerGas: '3',
    };

    const { queryByText } = renderWithProvider(
      <GasTiming {...props} />,
      mockStore,
    );

    await waitFor(() => {
      expect(queryByText(/Maybe in/u)).toBeInTheDocument();
    });
  });
});
