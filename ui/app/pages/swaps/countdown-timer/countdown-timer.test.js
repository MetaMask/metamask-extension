import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../../test/jest';
import CountdownTimer from '.';

describe('CountdownTimer', () => {
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

  const store = configureMockStore()(createSwapsMockStore());

  it('renders the component with initial props', () => {
    const { getByTestId } = renderWithProvider(
      <CountdownTimer {...createProps()} />,
      store,
    );
    expect(getByTestId('countdown-timer__timer-container')).toBeInTheDocument();
  });
});
