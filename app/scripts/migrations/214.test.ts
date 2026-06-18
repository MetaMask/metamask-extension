import migrate, { version } from './214';

describe(`migration #${version}`, () => {
  it('bumps the state version', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    await migrate(state, new Set());
    expect(state.meta.version).toBe(version);
  });

  it('removes latestNonAnonymousEventTimestamp from MetaMetricsController', async () => {
    const state = {
      meta: { version: version - 1 },
      data: {
        MetaMetricsController: {
          latestNonAnonymousEventTimestamp: 1717779342113,
          completedMetaMetricsOnboarding: true,
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(state.meta.version).toBe(version);
    expect(
      state.data.MetaMetricsController.latestNonAnonymousEventTimestamp,
    ).toBeUndefined();
    expect(
      state.data.MetaMetricsController.completedMetaMetricsOnboarding,
    ).toBe(true);
    expect(changedControllers).toEqual(new Set(['MetaMetricsController']));
  });

  it('is a no-op when MetaMetricsController is missing', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(changedControllers.size).toBe(0);
  });

  it('is a no-op when latestNonAnonymousEventTimestamp is already absent', async () => {
    const state = {
      meta: { version: version - 1 },
      data: {
        MetaMetricsController: {
          completedMetaMetricsOnboarding: true,
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(changedControllers.size).toBe(0);
  });
});
