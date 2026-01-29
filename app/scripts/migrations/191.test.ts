import { migrate, version } from './191';

const oldVersion = 190;
const MOCK_SNAP_ID = 'npm:@consensys/institutional-wallet-snap';

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if CronjobController state is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({});
  });

  it('does nothing if CronjobController.events is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CronjobController: {},
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.CronjobController).toStrictEqual({});
  });

  it('does nothing if all cron expressions are valid', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CronjobController: {
          events: {
            'cronjob-1': {
              id: 'cronjob-1',
              recurring: true,
              schedule: '*/30 * * * * *',
              scheduledAt: '2023-10-01T00:00:00.000Z',
              snapId: MOCK_SNAP_ID,
              date: '2023-10-01T00:00:30.000Z',
              request: {
                method: 'execute',
              },
            },
            'cronjob-2': {
              id: 'cronjob-2',
              recurring: true,
              schedule: '0 0 * * * *',
              scheduledAt: '2023-10-01T00:00:00.000Z',
              snapId: MOCK_SNAP_ID,
              date: '2023-10-01T01:00:00.000Z',
              request: {
                method: 'execute',
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.CronjobController).toStrictEqual(
      oldStorage.data.CronjobController,
    );
  });

  it('fixes cron expressions with + instead of /', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CronjobController: {
          events: {
            'cronjob-1': {
              id: 'cronjob-1',
              recurring: true,
              schedule: '5+15 * * * * *',
              scheduledAt: '2023-10-01T00:00:00.000Z',
              snapId: MOCK_SNAP_ID,
              date: '2023-10-01T00:00:05.000Z',
              request: {
                method: 'execute',
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(
      // @ts-expect-error - accessing nested property
      newStorage.data.CronjobController.events['cronjob-1'].schedule,
    ).toBe('5/15 * * * * *');
  });

  it('removes events with unfixable invalid cron expressions', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CronjobController: {
          events: {
            'cronjob-1': {
              id: 'cronjob-1',
              recurring: true,
              schedule: 'invalid cron',
              scheduledAt: '2023-10-01T00:00:00.000Z',
              snapId: MOCK_SNAP_ID,
              date: '2023-10-01T00:00:00.000Z',
              request: {
                method: 'execute',
              },
            },
            'cronjob-2': {
              id: 'cronjob-2',
              recurring: true,
              schedule: '*/30 * * * * *',
              scheduledAt: '2023-10-01T00:00:00.000Z',
              snapId: MOCK_SNAP_ID,
              date: '2023-10-01T00:00:30.000Z',
              request: {
                method: 'execute',
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // @ts-expect-error - accessing nested property
    const { events } = newStorage.data.CronjobController;
    expect(events['cronjob-1']).toBeUndefined();
    expect(events['cronjob-2']).toBeDefined();
  });

  it('handles mixed valid, fixable, and unfixable expressions', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CronjobController: {
          events: {
            'cronjob-valid': {
              id: 'cronjob-valid',
              recurring: true,
              schedule: '0 0 * * * *',
              scheduledAt: '2023-10-01T00:00:00.000Z',
              snapId: MOCK_SNAP_ID,
              date: '2023-10-01T01:00:00.000Z',
              request: {
                method: 'execute',
              },
            },
            'cronjob-fixable': {
              id: 'cronjob-fixable',
              recurring: true,
              schedule: '10+20 * * * * *',
              scheduledAt: '2023-10-01T00:00:00.000Z',
              snapId: MOCK_SNAP_ID,
              date: '2023-10-01T00:00:10.000Z',
              request: {
                method: 'execute',
              },
            },
            'cronjob-unfixable': {
              id: 'cronjob-unfixable',
              recurring: true,
              schedule: 'completely invalid',
              scheduledAt: '2023-10-01T00:00:00.000Z',
              snapId: MOCK_SNAP_ID,
              date: '2023-10-01T00:00:00.000Z',
              request: {
                method: 'execute',
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // @ts-expect-error - accessing nested property
    const { events } = newStorage.data.CronjobController;

    // Valid expression should remain unchanged
    expect(events['cronjob-valid']).toBeDefined();
    expect(events['cronjob-valid'].schedule).toBe('0 0 * * * *');

    // Fixable expression should be fixed
    expect(events['cronjob-fixable']).toBeDefined();
    expect(events['cronjob-fixable'].schedule).toBe('10/20 * * * * *');

    // Unfixable expression should be removed
    expect(events['cronjob-unfixable']).toBeUndefined();
  });

  it('does not modify non-recurring events', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CronjobController: {
          events: {
            'non-recurring': {
              id: 'non-recurring',
              recurring: false,
              schedule: 'invalid but not checked',
              scheduledAt: '2023-10-01T00:00:00.000Z',
              snapId: MOCK_SNAP_ID,
              date: '2023-10-01T00:00:00.000Z',
              request: {
                method: 'execute',
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // @ts-expect-error - accessing nested property
    const { events } = newStorage.data.CronjobController;
    expect(events['non-recurring']).toBeDefined();
    expect(events['non-recurring'].schedule).toBe('invalid but not checked');
  });

  it('handles the specific case from the error report', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CronjobController: {
          events: {
            [`cronjob-${MOCK_SNAP_ID}-0`]: {
              id: `cronjob-${MOCK_SNAP_ID}-0`,
              recurring: true,
              schedule: '5+15 * * * * *',
              scheduledAt: '2023-10-01T00:00:00.000Z',
              snapId: MOCK_SNAP_ID,
              date: '2023-10-01T00:00:05.000Z',
              request: {
                method: 'execute',
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // @ts-expect-error - accessing nested property
    const { events } = newStorage.data.CronjobController;
    const eventKey = `cronjob-${MOCK_SNAP_ID}-0`;

    expect(events[eventKey]).toBeDefined();
    expect(events[eventKey].schedule).toBe('5/15 * * * * *');
  });
});
