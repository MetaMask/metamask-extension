import { getRemoteWrapperSampleRate } from './sentry-remote-rates';
import {
  admitTraceWrappers,
  isRootWrapperEnabled,
  shouldSampleWrappers,
} from './wrapper-sampling';

jest.mock('./sentry-remote-rates', () => ({
  getRemoteWrapperSampleRate: jest.fn(),
}));

describe('isRootWrapperEnabled', () => {
  const originalKillSwitch = process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED;

  beforeEach(() => {
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

  it('creates the root wrapper whatever the wrapper sample rate', () => {
    jest.mocked(getRemoteWrapperSampleRate).mockReturnValue(0);
    expect(isRootWrapperEnabled()).toBe(true);
  });

  it('creates no root wrapper when distributed tracing is disabled', () => {
    process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED = 'true';
    expect(isRootWrapperEnabled()).toBe(false);
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
