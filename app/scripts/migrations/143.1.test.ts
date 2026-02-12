import { migrate, version } from './143.1';

const oldVersion = 143;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('removes the previousUserTraits property from MetaMetricsController state and does not remove other properties', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          MetaMetricsController: {
            previousUserTraits: { test: 123 },
            foo: 'bar',
          },
        },
      };
      const expectedData = {
        MetaMetricsController: {
          foo: 'bar',
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('has no effect if the previousUserTraits property does not exist', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          MetaMetricsController: {
            foo: 'bar',
          },
        },
      };
      const expectedData = {
        MetaMetricsController: {
          foo: 'bar',
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
