import React from 'react';
import { renderWithProvider, screen } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import { GasFeeContext } from '../../../../../contexts/gasFee';
import NetworkStatistics from './network-statistics';

const renderComponent = ({ gasFeeContext = {}, state = {} } = {}) => {
  const store = configureStore(state);
  return renderWithProvider(
    <GasFeeContext.Provider value={gasFeeContext}>
      <NetworkStatistics />
    </GasFeeContext.Provider>,
    store,
  );
};

describe('NetworkStatistics', () => {
  it('should render the latest base fee rounded to no decimal places', () => {
    renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          estimatedBaseFee: '50.0112',
        },
      },
    });
    expect(screen.getByText('50 GWEI')).toBeInTheDocument();
  });

  it('should not render the latest base fee if it is not present', () => {
    renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          estimatedBaseFee: null,
        },
      },
    });
    expect(
      screen.queryByTestId('formatted-latest-base-fee'),
    ).not.toBeInTheDocument();
  });

  it('should not render the latest base fee if no gas fee estimates are available', () => {
    renderComponent({
      gasFeeContext: {
        gasFeeEstimates: null,
      },
    });
    expect(
      screen.queryByTestId('formatted-latest-base-fee'),
    ).not.toBeInTheDocument();
  });

  it('should render the latest priority fee range, with the low end of the range rounded to 1 decimal place and the high end rounded to no decimal places', () => {
    renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          latestPriorityFeeRange: ['1.100001668', '2.5634234'],
        },
      },
    });
    expect(screen.getByText('1.1 - 3 GWEI')).toBeInTheDocument();
  });

  it('should not render the latest priority fee range if it is not present', () => {
    renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          latestPriorityFeeRange: null,
        },
      },
    });
    expect(
      screen.queryByTestId('formatted-latest-priority-fee-range'),
    ).not.toBeInTheDocument();
  });

  it('should not render the latest priority fee range if no gas fee estimates are available', () => {
    renderComponent({
      gasFeeContext: {
        gasFeeEstimates: null,
      },
    });
    expect(
      screen.queryByTestId('formatted-latest-priority-fee-range'),
    ).not.toBeInTheDocument();
  });

  it('should render the network status slider', () => {
    renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          networkCongestion: 0.5,
        },
      },
    });
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  it('should not render the network status slider if the network congestion is not available', () => {
    renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          networkCongestion: null,
        },
      },
    });
    expect(screen.queryByTestId('status-slider-label')).not.toBeInTheDocument();
  });

  it('should not render the network status slider if no gas fee estimates are available', () => {
    renderComponent({
      gasFeeContext: {
        gasFeeEstimates: null,
      },
    });
    expect(screen.queryByTestId('status-slider-label')).not.toBeInTheDocument();
  });
});
