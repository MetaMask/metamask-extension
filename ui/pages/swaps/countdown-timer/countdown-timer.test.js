import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import CountdownTimer from '.';

const createProps = (customProps = {}) => {
  return {
    timeStarted: 1,
    timeOnly: true,
    timerBase: 5,
    warningTime: '0:30',
    labelKey: 'swapNewQuoteIn',
    infoTooltipLabelKey: 'swapQuotesAreRefreshed',
    ...customProps,
  };
};

describe('CountdownTimer', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByTestId } = renderWithProvider(
      <CountdownTimer {...createProps()} />,
      store,
    );
    expect(getByTestId('countdown-timer__timer-container')).toBeInTheDocument();
  });
});
