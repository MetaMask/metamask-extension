import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import CountdownTimer from './index';

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

  const store = configureMockStore()(global.createSwapsMockStore());

  test('renders the component with initial props', () => {
    const { getByTestId } = renderWithProvider(
        <CountdownTimer {...createProps()} />,
        store,
      );
    expect(getByTestId('countdown-timer__timer-container')).toBeInTheDocument();
  });
});
