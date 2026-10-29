import React from 'react';
import { act, render } from '@testing-library/react';
import FormattedCounter from './formatted-counter';

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
    // Render in its own act so useEffect flushes before we inspect the spy
    await act(async () => {
      render(
        <FormattedCounter startFrom={10} onCountdownEnd={mockUnlockCallback} />,
      );
    });

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

    // Speed up the countdown and confirm the end-callback fires
    act(() => {
      jest.advanceTimersByTime(12 * 1000);
    });

    expect(mockUnlockCallback).toHaveBeenCalled();
  });
});
