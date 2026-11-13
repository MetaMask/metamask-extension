import { BACKGROUND_INITIALIZED_METHOD } from '../constants/ui-initialization';
import * as timing from './ui-startup-timing';

describe('background initialization timing', () => {
  it('retains the initialized timestamp across unrelated port messages', () => {
    expect(timing.getBackgroundInitializedAt()).toBeUndefined();

    timing.recordBackgroundInitializationTiming({
      data: {
        method: BACKGROUND_INITIALIZED_METHOD,
        params: { initializedAt: 1_700_000_000_000 },
      },
    });
    expect(timing.getBackgroundInitializedAt()).toBe(1_700_000_000_000);

    timing.recordBackgroundInitializationTiming({
      data: { method: 'ALIVE' },
    });
    expect(timing.getBackgroundInitializedAt()).toBe(1_700_000_000_000);
  });
});
