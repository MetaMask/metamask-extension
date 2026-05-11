import {
  buildTrackErrorEventProperties,
  createTrackErrorEventSession,
  TrackErrorTelemetrySeverity,
  userIncludedInErrorTelemetrySample,
} from './track-error-event';

describe('buildTrackErrorEventProperties', () => {
  it('includes required snake_case fields and optional error_context', () => {
    const properties = buildTrackErrorEventProperties({
      event: 'Error occured',
      category: 'Settings',
      source: 'unit_test',
      severity: TrackErrorTelemetrySeverity.Error,
      error: new Error('hello'),
      context: { foo: 'bar' },
    });
    expect(properties.error_source).toBe('unit_test');
    expect(properties.error_severity).toBe('error');
    expect(properties.error_message).toBe('hello');
    expect(properties.error_context).toStrictEqual({ foo: 'bar' });
  });

  it('truncates long messages', () => {
    const long = 'x'.repeat(3000);
    const properties = buildTrackErrorEventProperties(
      {
        event: 'e',
        category: 'c',
        source: 's',
        severity: TrackErrorTelemetrySeverity.Warning,
        error: new Error(long),
      },
      100,
    );
    expect((properties.error_message as string).length).toBeLessThanOrEqual(
      101,
    );
  });
});

describe('createTrackErrorEventSession', () => {
  it('emits once and invokes submit with merged properties', async () => {
    const session = createTrackErrorEventSession({ sampleRate: 1 });
    const submit = jest.fn();
    const result = await session.trackErrorEvent(submit, {
      event: 'Error occured',
      category: 'Settings',
      source: 'test',
      severity: TrackErrorTelemetrySeverity.Error,
      error: new Error('boom'),
    });
    expect(result).toStrictEqual({ sent: true });
    expect(submit).toHaveBeenCalledTimes(1);
    const [payload] = submit.mock.calls[0];
    expect(payload.event).toBe('Error occured');
    expect(payload.category).toBe('Settings');
    expect(payload.properties?.error_message).toBe('boom');
    expect(payload.properties?.error_source).toBe('test');
  });

  it('deduplicates identical signatures within the window', async () => {
    const session = createTrackErrorEventSession({
      sampleRate: 1,
      dedupeWindowMs: 60_000,
      maxEmissionsPerSignaturePerWindow: 1,
      now: () => 1000,
    });
    const submit = jest.fn();
    const input = {
      event: 'Error occured',
      category: 'Settings',
      source: 'dedupe_test',
      severity: TrackErrorTelemetrySeverity.Error,
      error: new Error('same'),
    };
    await session.trackErrorEvent(submit, input);
    const second = await session.trackErrorEvent(submit, input);
    expect(second).toStrictEqual({ sent: false, reason: 'deduplicated' });
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('respects session cap', async () => {
    const session = createTrackErrorEventSession({
      sampleRate: 1,
      globalSessionCap: 2,
    });
    const submit = jest.fn().mockResolvedValue(undefined);
    await session.trackErrorEvent(submit, {
      event: 'a',
      category: 'c',
      source: 's1',
      severity: TrackErrorTelemetrySeverity.Error,
      error: new Error('1'),
    });
    await session.trackErrorEvent(submit, {
      event: 'b',
      category: 'c',
      source: 's2',
      severity: TrackErrorTelemetrySeverity.Error,
      error: new Error('2'),
    });
    const third = await session.trackErrorEvent(submit, {
      event: 'c',
      category: 'c',
      source: 's3',
      severity: TrackErrorTelemetrySeverity.Error,
      error: new Error('3'),
    });
    expect(third).toStrictEqual({ sent: false, reason: 'session_capped' });
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('applies per-user cohort sampling (deterministic by metaMetricsId)', async () => {
    const getDeterministicRandomNumberForUser = (id: string) =>
      id === 'in_cohort' ? 0.1 : 0.9;
    const submit = jest.fn();
    const input = {
      event: 'e',
      category: 'c',
      source: 's',
      severity: TrackErrorTelemetrySeverity.Error,
      error: new Error('x'),
    };
    const includedSession = createTrackErrorEventSession({
      sampleRate: 0.5,
      metaMetricsId: 'in_cohort',
      getDeterministicRandomNumberForUser,
    });
    const excludedSession = createTrackErrorEventSession({
      sampleRate: 0.5,
      metaMetricsId: 'out_cohort',
      getDeterministicRandomNumberForUser,
    });
    const included = await includedSession.trackErrorEvent(submit, input);
    const excluded = await excludedSession.trackErrorEvent(submit, input);
    expect(included).toStrictEqual({ sent: true });
    expect(excluded).toStrictEqual({ sent: false, reason: 'sampled' });
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('same user always gets same cohort outcome for repeated events', async () => {
    const session = createTrackErrorEventSession({
      sampleRate: 0.5,
      metaMetricsId: 'user-1',
      getDeterministicRandomNumberForUser: () => 0.1,
    });
    const submit = jest.fn();
    const input = {
      event: 'e',
      category: 'c',
      source: 's',
      severity: TrackErrorTelemetrySeverity.Error,
      error: new Error('a'),
    };
    await session.trackErrorEvent(submit, input);
    await session.trackErrorEvent(submit, { ...input, error: new Error('b') });
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('reset clears dedupe and total', async () => {
    const session = createTrackErrorEventSession({ sampleRate: 1 });
    const submit = jest.fn();
    const input = {
      event: 'e',
      category: 'c',
      source: 's',
      severity: TrackErrorTelemetrySeverity.Error,
      error: new Error('same'),
    };
    await session.trackErrorEvent(submit, input);
    session.reset();
    await session.trackErrorEvent(submit, input);
    expect(submit).toHaveBeenCalledTimes(2);
    expect(session.getTotalEmitted()).toBe(1);
  });
});

describe('userIncludedInErrorTelemetrySample', () => {
  it('includes all users when sampleRate is 1', () => {
    expect(
      userIncludedInErrorTelemetrySample('any-id', 1, () => {
        throw new Error('should not call');
      }),
    ).toBe(true);
  });

  it('excludes all users when sampleRate is 0', () => {
    expect(userIncludedInErrorTelemetrySample('any-id', 0, () => 0)).toBe(
      false,
    );
  });

  it('uses deterministic function on metaMetricsId', () => {
    const deterministic = jest.fn().mockReturnValue(0.1);
    expect(userIncludedInErrorTelemetrySample('u1', 0.5, deterministic)).toBe(
      true,
    );
    expect(deterministic).toHaveBeenCalledWith('u1');
    deterministic.mockReturnValue(0.9);
    expect(userIncludedInErrorTelemetrySample('u1', 0.5, deterministic)).toBe(
      false,
    );
  });

  it('treats null metaMetricsId as empty string for cohort', () => {
    const deterministic = jest.fn().mockReturnValue(0.1);
    userIncludedInErrorTelemetrySample(null, 0.5, deterministic);
    expect(deterministic).toHaveBeenCalledWith('');
  });
});
