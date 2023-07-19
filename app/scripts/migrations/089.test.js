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

  it('deletes the PhishingController" state', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: { PhishingController: {} },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.PhishingController).toBeUndefined();
  });
});
