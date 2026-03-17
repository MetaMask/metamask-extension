import { migrate, version } from './192';

const VERSION = version;
const oldVersion = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const changedControllers = new Set<string>();
    await migrate(oldStorage, changedControllers);

    expect(oldStorage.meta.version).toBe(VERSION);
  });

  it('moves firstTimeInfo from top-level state to AppMetadataController', async () => {
    const firstTimeInfo = {
      version: '10.0.0',
      date: 1700000000000,
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        firstTimeInfo,
        AppMetadataController: {
          currentAppVersion: '11.0.0',
          previousAppVersion: '10.0.0',
        },
      },
    };

    const changedControllers = new Set<string>();
    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.firstTimeInfo).toBeUndefined();
    expect(oldStorage.data.AppMetadataController).toStrictEqual({
      currentAppVersion: '11.0.0',
      previousAppVersion: '10.0.0',
      firstTimeInfo,
    });
    expect(changedControllers.has('AppMetadataController')).toBe(true);
    // firstTimeInfo must be in changedControllers so it gets deleted in split storage mode
    expect(changedControllers.has('firstTimeInfo')).toBe(true);
  });

  it('creates AppMetadataController if it does not exist', async () => {
    const firstTimeInfo = {
      version: '10.0.0',
      date: 1700000000000,
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        firstTimeInfo,
      } as Record<string, unknown>,
    };

    const changedControllers = new Set<string>();
    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.firstTimeInfo).toBeUndefined();
    expect(oldStorage.data.AppMetadataController).toStrictEqual({
      firstTimeInfo,
    });
    expect(changedControllers.has('AppMetadataController')).toBe(true);
    // firstTimeInfo must be in changedControllers so it gets deleted in split storage mode
    expect(changedControllers.has('firstTimeInfo')).toBe(true);
  });

  it('does nothing if firstTimeInfo does not exist', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AppMetadataController: {
          currentAppVersion: '11.0.0',
        },
      },
    };

    const changedControllers = new Set<string>();
    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.AppMetadataController).toStrictEqual({
      currentAppVersion: '11.0.0',
    });
    expect(changedControllers.has('AppMetadataController')).toBe(false);
  });

  it('deletes invalid firstTimeInfo without version string', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        firstTimeInfo: {
          version: 123, // should be string
          date: 1700000000000,
        },
        AppMetadataController: {
          currentAppVersion: '11.0.0',
        },
      },
    };

    const changedControllers = new Set<string>();
    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.firstTimeInfo).toBeUndefined();
    expect(oldStorage.data.AppMetadataController).toStrictEqual({
      currentAppVersion: '11.0.0',
    });
    expect(changedControllers.has('AppMetadataController')).toBe(false);
    // firstTimeInfo must be in changedControllers so it gets deleted in split storage mode
    expect(changedControllers.has('firstTimeInfo')).toBe(true);
  });

  it('deletes invalid firstTimeInfo without date number', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        firstTimeInfo: {
          version: '10.0.0',
          date: 'invalid', // should be number
        },
        AppMetadataController: {
          currentAppVersion: '11.0.0',
        },
      },
    };

    const changedControllers = new Set<string>();
    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.firstTimeInfo).toBeUndefined();
    expect(oldStorage.data.AppMetadataController).toStrictEqual({
      currentAppVersion: '11.0.0',
    });
    expect(changedControllers.has('AppMetadataController')).toBe(false);
    // firstTimeInfo must be in changedControllers so it gets deleted in split storage mode
    expect(changedControllers.has('firstTimeInfo')).toBe(true);
  });

  it('deletes firstTimeInfo if it is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        firstTimeInfo: 'invalid',
        AppMetadataController: {
          currentAppVersion: '11.0.0',
        },
      },
    };

    const changedControllers = new Set<string>();
    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.firstTimeInfo).toBeUndefined();
    expect(oldStorage.data.AppMetadataController).toStrictEqual({
      currentAppVersion: '11.0.0',
    });
    expect(changedControllers.has('AppMetadataController')).toBe(false);
    // firstTimeInfo must be in changedControllers so it gets deleted in split storage mode
    expect(changedControllers.has('firstTimeInfo')).toBe(true);
  });
});
