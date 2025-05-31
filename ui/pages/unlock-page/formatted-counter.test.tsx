import React from 'react';
import FormattedCounter from "./formatted-counter";
import { act, render } from '@testing-library/react';

const mockUnlockCallback = jest.fn();

describe('FormattedCounter', () => {
  let setIntervalSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.useFakeTimers();
    setIntervalSpy = jest.spyOn(global, 'setInterval');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render and start triggering the countdown', async () => {
    await act(async () => {
      render(<FormattedCounter remainingTime={10} unlock={mockUnlockCallback} />);

      // speed up the countdown
      jest.advanceTimersByTime(12 * 1000);

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      expect(mockUnlockCallback).toHaveBeenCalled();
    });
  });
});

