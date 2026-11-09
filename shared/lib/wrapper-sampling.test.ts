import { getRemoteWrapperSampleRate } from './sentry-remote-rates';
import { shouldSampleRootWrapper } from './wrapper-sampling';

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
    process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED = originalKillSwitch;
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
