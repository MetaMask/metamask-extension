import { jest } from '@jest/globals';
import { createPostUpdateReloadDecisionTracker } from './post-update-reload-decision';

describe('createPostUpdateReloadDecisionTracker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('records an internal UI connection attempt', async () => {
    const tracker = createPostUpdateReloadDecisionTracker();
    const connectionPromise = tracker.waitForInternalUiConnectionAttempt(150);

    tracker.recordInternalUiConnectionAttempt();
    tracker.recordInternalUiConnectionAttempt();

    await expect(connectionPromise).resolves.toBe(true);
    expect(tracker.hasInternalUiConnectionAttempt()).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('resolves false when no internal UI connection attempt is recorded', async () => {
    const tracker = createPostUpdateReloadDecisionTracker();
    const connectionPromise = tracker.waitForInternalUiConnectionAttempt(150);

    await jest.advanceTimersByTimeAsync(150);

    await expect(connectionPromise).resolves.toBe(false);
    expect(tracker.hasInternalUiConnectionAttempt()).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });
});
