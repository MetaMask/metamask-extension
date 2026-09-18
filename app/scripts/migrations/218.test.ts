import { migrate, version } from './218';

const oldVersion = version - 1;

describe(`migration #${version}`, () => {
  it('bumps the state version', async () => {
    const state = { meta: { version: oldVersion }, data: {} };
    await migrate(state, new Set());
    expect(state.meta.version).toBe(version);
  });

  it('is a no-op when PreferencesController state is missing', async () => {
    const state = { meta: { version: oldVersion }, data: {} };
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.data).toEqual({});
    expect(changed.size).toBe(0);
  });

  it('resets chain-scoped advanced gas fee preferences', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          advancedGasFee: {
            '0x1': {
              maxBaseFee: '75',
              priorityFee: '2',
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);

    expect(state.data.PreferencesController.advancedGasFee).toStrictEqual({});
    expect(changed.has('PreferencesController')).toBe(true);
  });

  it('preserves account-scoped advanced gas fee preferences', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          advancedGasFee: {
            '0x1': {
              '0xABC': {
                userFeeLevel: 'custom',
                maxBaseFee: '75',
                priorityFee: '2',
              },
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);

    expect(state.data.PreferencesController.advancedGasFee).toStrictEqual({
      '0x1': {
        '0xabc': {
          userFeeLevel: 'custom',
          maxBaseFee: '75',
          priorityFee: '2',
        },
      },
    });
    expect(changed.has('PreferencesController')).toBe(true);
  });

  it('removes malformed account-scoped advanced gas fee preferences', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          advancedGasFee: {
            '0x1': {
              '0xabc': {
                userFeeLevel: 'custom',
                maxBaseFee: 75,
              },
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);

    expect(state.data.PreferencesController.advancedGasFee).toStrictEqual({});
    expect(changed.has('PreferencesController')).toBe(true);
  });
});
