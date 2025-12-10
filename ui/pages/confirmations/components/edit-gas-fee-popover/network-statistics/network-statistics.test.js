import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
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
    const { getByText } = renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          estimatedBaseFee: '50.0112',
        },
      },
    });
    expect(getByText('50 GWEI')).toBeInTheDocument();
  });

  it('should not render the latest base fee if it is not present', () => {
    const { queryByTestId } = renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          estimatedBaseFee: null,
        },
      },
    });
    expect(queryByTestId('formatted-latest-base-fee')).not.toBeInTheDocument();
  });

  it('should not render the latest base fee if no gas fee estimates are available', () => {
    const { queryByTestId } = renderComponent({
      gasFeeContext: {
        gasFeeEstimates: null,
      },
    });
    expect(queryByTestId('formatted-latest-base-fee')).not.toBeInTheDocument();
  });

  it('should render the latest priority fee range, with the low end of the range rounded to 1 decimal place and the high end rounded to no decimal places', () => {
    const { getByText } = renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          latestPriorityFeeRange: ['1.100001668', '2.5634234'],
        },
      },
    });
    expect(getByText('1.1 - 3 GWEI')).toBeInTheDocument();
  });

  it('should not render the latest priority fee range if it is not present', () => {
    const { queryByTestId } = renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          latestPriorityFeeRange: null,
        },
      },
    });
    expect(
      queryByTestId('formatted-latest-priority-fee-range'),
    ).not.toBeInTheDocument();
  });

  it('should not render the latest priority fee range if no gas fee estimates are available', () => {
    const { queryByTestId } = renderComponent({
      gasFeeContext: {
        gasFeeEstimates: null,
      },
    });
    expect(
      queryByTestId('formatted-latest-priority-fee-range'),
    ).not.toBeInTheDocument();
  });

  it('should render the network status slider', () => {
    const { getByText } = renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          networkCongestion: 0.5,
        },
      },
    });
    expect(getByText('Stable')).toBeInTheDocument();
  });

  it('should not render the network status slider if the network congestion is not available', () => {
    const { queryByTestId } = renderComponent({
      gasFeeContext: {
        gasFeeEstimates: {
          networkCongestion: null,
        },
      },
    });
    expect(queryByTestId('status-slider-label')).not.toBeInTheDocument();
  });

  it('should not render the network status slider if no gas fee estimates are available', () => {
    const { queryByTestId } = renderComponent({
      gasFeeContext: {
        gasFeeEstimates: null,
      },
    });
    expect(queryByTestId('status-slider-label')).not.toBeInTheDocument();
  });
});
