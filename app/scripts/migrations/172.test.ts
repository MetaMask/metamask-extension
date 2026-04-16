import { migrate, version } from './172';

describe('migration #172', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 171 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('adds tracesBeforeMetricsOptIn to MetaMetricsController state when missing', async () => {
    const oldStorage = {
      meta: { version: 171 },
      data: {
        MetaMetricsController: {
          participateInMetaMetrics: true,
          metaMetricsId: 'test-id',
          eventsBeforeMetricsOptIn: [],
          traits: {},
          fragments: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.MetaMetricsController).toStrictEqual({
      participateInMetaMetrics: true,
      metaMetricsId: 'test-id',
      eventsBeforeMetricsOptIn: [],
      tracesBeforeMetricsOptIn: [],
      traits: {},
      fragments: {},
    });
  });

  it('does not modify tracesBeforeMetricsOptIn if it already exists', async () => {
    const oldStorage = {
      meta: { version: 171 },
      data: {
        MetaMetricsController: {
          participateInMetaMetrics: true,
          metaMetricsId: 'test-id',
          eventsBeforeMetricsOptIn: [],
          tracesBeforeMetricsOptIn: [
            { type: 'start', request: { name: 'test' } },
          ],
          traits: {},
          fragments: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.MetaMetricsController).toStrictEqual({
      participateInMetaMetrics: true,
      metaMetricsId: 'test-id',
      eventsBeforeMetricsOptIn: [],
      tracesBeforeMetricsOptIn: [{ type: 'start', request: { name: 'test' } }],
      traits: {},
      fragments: {},
    });
  });

  it('does nothing if MetaMetricsController state is missing', async () => {
    const oldStorage = {
      meta: { version: 171 },
      data: {
        SomeOtherController: {
          someProperty: 'value',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      SomeOtherController: {
        someProperty: 'value',
      },
    });
  });

  it('does nothing if MetaMetricsController state is not an object', async () => {
    const oldStorage = {
      meta: { version: 171 },
      data: {
        MetaMetricsController: null,
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      MetaMetricsController: null,
    });
  });
});
