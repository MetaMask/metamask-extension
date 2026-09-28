import React from 'react';
import { act } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createSwapsMockStore } from '../../../../test/jest';
import CountdownTimer from '.';

const createProps = (customProps = {}) => {
  return {
    timeStarted: 1,
    timeOnly: true,
    timerBase: 5,
    warningTime: '0:30',
    labelKey: 'swapNewQuoteIn',
    ...customProps,
  };
};

describe('CountdownTimer', () => {
  it('renders the component with initial props', async () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByTestId } = renderWithProvider(
      <CountdownTimer {...createProps()} />,
      store,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByTestId('countdown-timer__timer-container')).toBeInTheDocument();
  });
});
