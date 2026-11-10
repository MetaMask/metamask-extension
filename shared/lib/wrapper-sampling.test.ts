import { getRemoteWrapperSampleRate } from './sentry-remote-rates';
import {
  admitTraceWrappers,
  shouldSampleRootWrapper,
  shouldSampleWrappers,
} from './wrapper-sampling';

jest.mock('./sentry-remote-rates', () => ({
  getRemoteWrapperSampleRate: jest.fn(),
}));

describe('shouldSampleRootWrapper', () => {
  const originalKillSwitch = process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED;

  beforeEach(() => {
    jest.mocked(getRemoteWrapperSampleRate).mockReturnValue(undefined);
    delete process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED;
  });

  afterAll(() => {
    // Assigning `undefined` to `process.env` stores the string "undefined".
    if (originalKillSwitch === undefined) {
      delete process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED;
    } else {
      process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED = originalKillSwitch;
    }
  });

  it('samples a draw below the default rate', () => {
    expect(shouldSampleRootWrapper(() => 0.004)).toBe(true);
  });

  it('rejects a draw at or above the default rate', () => {
    expect(shouldSampleRootWrapper(() => 0.005)).toBe(false);
  });

  it('uses the remote rate when one was read', () => {
    jest.mocked(getRemoteWrapperSampleRate).mockReturnValue(0.5);
    expect(shouldSampleRootWrapper(() => 0.4)).toBe(true);
    expect(shouldSampleRootWrapper(() => 0.6)).toBe(false);
  });

  it('rejects everything when distributed tracing is disabled', () => {
    process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED = 'true';
    expect(shouldSampleRootWrapper(() => 0)).toBe(false);
  });
});

describe('admitTraceWrappers', () => {
  const traceId = 'ffffffff000000000000000000000000';

  beforeEach(() => {
    jest.mocked(getRemoteWrapperSampleRate).mockReturnValue(0);
  });

  it('admits wrapper spans in the trace while the root runs, and only then', async () => {
    expect(shouldSampleWrappers(traceId)).toBe(false);
    const inside = await admitTraceWrappers(traceId, () =>
      shouldSampleWrappers(traceId),
    );
    expect(inside).toBe(true);
    expect(shouldSampleWrappers(traceId)).toBe(false);
  });

  it('releases the trace when the root throws', async () => {
    await expect(
      admitTraceWrappers(traceId, () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(shouldSampleWrappers(traceId)).toBe(false);
  });
});
