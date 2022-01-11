import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import { GasFeeContext } from '../../../../contexts/gasFee';
import configureStore from '../../../../store/store';

import NetworkStatistics from './network-statistics';

const renderComponent = (gasFeeEstimates) => {
  const store = configureStore({});
  return renderWithProvider(
    <GasFeeContext.Provider value={{ gasFeeEstimates }}>
      <NetworkStatistics />
    </GasFeeContext.Provider>,
    store,
  );
};

describe('NetworkStatistics', () => {
  it('should render the latest base fee without decimals', () => {
    const { getByText } = renderComponent({
      estimatedBaseFee: '50.0112',
    });
    expect(getByText('50 GWEI')).toBeInTheDocument();
  });

  it('should render a version of latest priority fee range pulled from context, lower range rounded to 1 decimal place', () => {
    const { getByText } = renderComponent({
      latestPriorityFeeRange: ['1.000001668', '2.5634234'],
    });
    expect(getByText('1 - 3 GWEI')).toBeInTheDocument();
  });
});
