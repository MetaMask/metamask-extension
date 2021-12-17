import React from 'react';

import { renderWithProvider } from '../../../../../../test/jest';
import { GasFeeContext } from '../../../../../contexts/gasFee';
import configureStore from '../../../../../store/store';

import LatestPriorityFeeField from './latest-priority-fee-field';

const renderComponent = (gasFeeEstimates) => {
  const store = configureStore({});
  return renderWithProvider(
    <GasFeeContext.Provider value={{ gasFeeEstimates }}>
      <LatestPriorityFeeField />
    </GasFeeContext.Provider>,
    store,
  );
};

describe('LatestPriorityFeeField', () => {
  it('should render a version of latest priority fee range pulled from context, rounded to 1 decimal place', () => {
    const { getByText } = renderComponent({
      latestPriorityFeeRange: ['1.000001668', '2.5634234'],
    });
    expect(getByText('1 - 2.6 GWEI')).toBeInTheDocument();
  });

  it('should render nothing if gasFeeEstimates are empty', () => {
    const { queryByText } = renderComponent({});
    expect(queryByText('GWEI')).not.toBeInTheDocument();
  });
});
