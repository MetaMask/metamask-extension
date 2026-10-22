import { BACKGROUND_INITIALIZED_METHOD } from '../constants/ui-initialization';
import * as timing from './ui-startup-timing';

describe('background initialization timing', () => {
  let isolatedTiming: typeof timing;
  beforeEach(() => {
    jest.isolateModules(() => {
      isolatedTiming = jest.requireActual('./ui-startup-timing');
    });
  });

  it('remains unknown before the initialized message arrives', () => {
    expect(isolatedTiming.getBackgroundInitializedAt()).toBeUndefined();
  });

  it('reads an epoch timestamp from the existing initialized message', () => {
    isolatedTiming.recordBackgroundInitializationTiming({
      data: {
        method: BACKGROUND_INITIALIZED_METHOD,
        params: { initializedAt: 1_700_000_000_000 },
      },
    });
    expect(isolatedTiming.getBackgroundInitializedAt()).toBe(1_700_000_000_000);
  });

  it('ignores unrelated port messages', () => {
    isolatedTiming.recordBackgroundInitializationTiming({
      data: { method: 'ALIVE' },
    });
    expect(isolatedTiming.getBackgroundInitializedAt()).toBeUndefined();
  });
});
