import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';

import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import FeeDetailsComponent from './fee-details-component';

jest.mock('../../../../store/actions', () => ({
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

const render = (state = {}) => {
  const store = configureStore()({ ...mockState, ...state });
  return renderWithProvider(<FeeDetailsComponent />, store);
};

describe('FeeDetailsComponent', () => {
  it('renders "Fee details"', () => {
    render();
    expect(screen.queryByText('Fee details')).toBeInTheDocument();
  });

  it('should expand when button is clicked', () => {
    render();
    expect(screen.queryByTitle('0 ETH')).not.toBeInTheDocument();
    screen.getByRole('button').click();
    expect(screen.queryByTitle('0 ETH')).toBeInTheDocument();
  });

  it('should be displayed for even legacy network', () => {
    render({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        networkDetails: {
          EIPS: {
            1559: false,
          },
        },
      },
    });
    expect(screen.queryByText('Fee details')).toBeInTheDocument();
  });
});
