import migration62 from './062';

describe('migration #62', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 61,
      },
      data: {},
    };

    const newStorage = await migration62.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 62,
    });
  });

  it('should remove metaMetricsSendCount from MetaMetricsController', async () => {
    const oldStorage = {
      meta: {},
      data: {
        MetaMetricsController: {
          metaMetricsSendCount: 1,
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration62.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      MetaMetricsController: {
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should remove metaMetricsSendCount from MetaMetricsController (falsey but defined)', async () => {
    const oldStorage = {
      meta: {},
      data: {
        MetaMetricsController: {
          metaMetricsSendCount: 0,
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration62.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      MetaMetricsController: {
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should not modify MetaMetricsController when metaMetricsSendCount is undefined', async () => {
    const oldStorage = {
      meta: {},
      data: {
        MetaMetricsController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration62.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      MetaMetricsController: {
        bar: 'baz',
      },
      foo: 'bar',
    });
  });
});
