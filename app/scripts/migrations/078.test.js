import { migrate, version } from './078';

describe('migration #78', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 77,
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
        version: 77,
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
          version: 77,
        },
        data: { PhishingController: invalidState },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
  }

  it('does not change the state if the phishing controller state does not include "phishing" or "lastFetched" properties', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: { PhishingController: { test: '123' } },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('deletes the "phishing" property', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: { PhishingController: { test: '123', phishing: [] } },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PhishingController: { test: '123' },
    });
  });

  it('deletes the "lastFetched" property', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: { PhishingController: { test: '123', lastFetched: 100 } },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PhishingController: { test: '123' },
    });
  });

  it('deletes the "phishing" and "lastFetched" properties', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        PhishingController: { test: '123', lastFetched: 100, phishing: [] },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PhishingController: { test: '123' },
    });
  });
});
