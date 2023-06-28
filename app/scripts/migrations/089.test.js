import { migrate, version } from './089';

const PREVIOUS_VERSION = version - 1;

describe('migration #89', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({
      version,
    });
  });

  it('does not change the state if the phishing controller state does not exist', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: { test: '123' },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  const nonObjects = [undefined, null, 'test', 1, ['test']];

  for (const invalidState of nonObjects) {
    it(`does not change the state if the phishing controller state is ${invalidState}`, async () => {
      const oldStorage = {
        meta: {
          version: PREVIOUS_VERSION,
        },
        data: { PhishingController: invalidState },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
  }

  it('does not change the state if the listState property does not exist', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: {
        PhishingController: { test: 123 },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('deletes the "listState" property', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: { PhishingController: { listState: {} } },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.PhishingController.listState).toBeUndefined();
  });

  it('migrates as expected if listState is present', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: { PhishingController: { listState: { test: 123 } } },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PhishingController: { phishingLists: [{ test: 123 }] },
    });
  });
});