import migrate, { version } from './219';

const buildState = (
  preferencesController?: Record<string, unknown>,
): { meta: { version: number }; data: Record<string, unknown> } => ({
  meta: { version: version - 1 },
  data: preferencesController
    ? { PreferencesController: preferencesController }
    : {},
});

describe(`migration #${version}`, () => {
  it('bumps the state version', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    await migrate(state, new Set());
    expect(state.meta.version).toBe(version);
  });

  it('skips silently when PreferencesController state is missing', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    const changed = new Set<string>();
    await expect(migrate(state, changed)).resolves.toBeUndefined();
    expect(state.meta.version).toBe(version);
    expect(changed.size).toBe(0);
  });

  it('clears a stored advancedGasFee and leaves other preferences untouched', async () => {
    const state = buildState({
      advancedGasFee: {
        '0x1': { maxBaseFee: '0.05', priorityFee: '0' },
      },
      useTokenDetection: true,
    });
    const changed = new Set<string>();

    await migrate(state, changed);

    const preferences = state.data.PreferencesController as Record<
      string,
      unknown
    >;
    expect(preferences.advancedGasFee).toStrictEqual({});
    expect(preferences.useTokenDetection).toBe(true);
    expect(changed.has('PreferencesController')).toBe(true);
  });

  it('is a no-op when advancedGasFee is already empty', async () => {
    const state = buildState({ advancedGasFee: {} });
    const before = JSON.parse(JSON.stringify(state.data));
    const changed = new Set<string>();

    await migrate(state, changed);

    expect(state.data).toEqual(before);
    expect(changed.size).toBe(0);
  });

  it('is a no-op when advancedGasFee is absent', async () => {
    const state = buildState({ useTokenDetection: true });
    const before = JSON.parse(JSON.stringify(state.data));
    const changed = new Set<string>();

    await migrate(state, changed);

    expect(state.data).toEqual(before);
    expect(changed.size).toBe(0);
  });
});
