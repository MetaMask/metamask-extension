import { it as jestIt } from '@jest/globals';
import { BACKGROUND_INITIALIZED_METHOD } from '../constants/ui-initialization';
import * as timing from './ui-startup-timing';

describe('background initialization timing', () => {
  let isolatedTiming: typeof timing;
  beforeEach(() => {
    jest.isolateModules(() => {
      isolatedTiming = jest.requireActual('./ui-startup-timing');
    });
  });

  it('remains unknown when the background does not send timing metadata', () => {
    isolatedTiming.recordBackgroundInitializationTiming({
      data: { method: BACKGROUND_INITIALIZED_METHOD },
    });
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

  jestIt.each([
    undefined,
    null,
    'invalid',
    {},
    { data: null },
    { data: { method: 'ALIVE', params: { initializedAt: 100 } } },
    { data: { method: BACKGROUND_INITIALIZED_METHOD, params: null } },
  ])('ignores malformed or unrelated messages: %j', (message) => {
    isolatedTiming.recordBackgroundInitializationTiming(message);
    expect(isolatedTiming.getBackgroundInitializedAt()).toBeUndefined();
  });

  jestIt.each([undefined, '100', null, 0, -1, NaN, Infinity])(
    'ignores invalid initialization times: %s',
    (initializedAt) => {
      isolatedTiming.recordBackgroundInitializationTiming({
        data: {
          method: BACKGROUND_INITIALIZED_METHOD,
          params: { initializedAt },
        },
      });
      expect(isolatedTiming.getBackgroundInitializedAt()).toBeUndefined();
    },
  );
});
