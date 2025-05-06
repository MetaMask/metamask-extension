import { act } from '@testing-library/react-hooks';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import mockState from '../../test/data/mock-state.json';
import { useShouldShowSpeedUp } from './useShouldShowSpeedUp';

describe('useShouldShowSpeedUp', () => {
  const currentChainId = '0x1';

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should return true immediately if the transaction was submitted over 5 seconds ago and conditions are met', () => {
    const now = Date.now();

    const transactionGroup = {
      transactions: [
        {
          chainId: currentChainId,
          submittedTime: now - 6000,
        },
      ],
      hasRetried: false,
    };

    const isEarliestNonce = true;

    const { result } = renderHookWithProvider(
      () => useShouldShowSpeedUp(transactionGroup, isEarliestNonce),
      mockState,
    );

    expect(result.current).toBe(true);
  });

  it('should initially return false when transaction is not older than 5 seconds and then become true after timeout', () => {
    const now = Date.now();

    const transactionGroup = {
      transactions: [
        {
          chainId: currentChainId,
          submittedTime: now - 3000, // submitted 3 seconds ago
        },
      ],
      hasRetried: false,
    };

    const isEarliestNonce = true;

    const { result } = renderHookWithProvider(
      () => useShouldShowSpeedUp(transactionGroup, isEarliestNonce),
      mockState,
    );

    // Initially, speed up is not enabled
    expect(result.current).toBe(false);

    // Advance timers until just past the 5 second threshold.
    act(() => {
      const remainingTime = 5001 - (Date.now() - (now - 3000));
      jest.advanceTimersByTime(remainingTime);
    });

    expect(result.current).toBe(true);
  });

  it('should remain false if hasRetried is true, regardless of timing', () => {
    const now = Date.now();

    const transactionGroup = {
      transactions: [
        {
          chainId: currentChainId,
          submittedTime: now - 6000,
        },
      ],
      hasRetried: true,
    };

    const isEarliestNonce = true;

    const { result } = renderHookWithProvider(
      () => useShouldShowSpeedUp(transactionGroup, isEarliestNonce),
      mockState,
    );

    expect(result.current).toBe(false);
  });

  it('should remain false if isEarliestNonce is false', () => {
    const now = Date.now();

    const transactionGroup = {
      transactions: [
        {
          chainId: currentChainId,
          submittedTime: now - 6000,
        },
      ],
      hasRetried: false,
    };

    const isEarliestNonce = false;

    const { result } = renderHookWithProvider(
      () => useShouldShowSpeedUp(transactionGroup, isEarliestNonce),
      mockState,
    );

    expect(result.current).toBe(false);
  });
});
