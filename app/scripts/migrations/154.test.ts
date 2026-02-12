import { migrate, version } from './154';

const oldVersion = 153;

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
    it('removes the QueuedRequestController from the state', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          QueuedRequestController: {
            queuedRequestCount: 0,
          },
        },
      };
      const expectedData = {};
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('does nothing to other state params', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          OtherController: {
            someParam: 0,
          },
        },
      };

      const expectedData = {
        OtherController: {
          someParam: 0,
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
