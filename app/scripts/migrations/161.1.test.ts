import { migrate, version, VersionedData } from './161.1';

const oldVersion = 161;

describe(`migration #${version}`, () => {
  // Set up a global sentry mock before each test.
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
  });

  afterEach(() => {
    // Clean up the global sentry after each test.
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage: VersionedData = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('captures sentry error and returns the original state if PreferencesController does not exist', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error('Invalid PreferencesController state: undefined'),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('captures sentry error and returns the original state if PreferencesController is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: 'not an object',
      },
    };

    const newStorage = await migrate(oldStorage as VersionedData);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error('Invalid PreferencesController state: string'),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('deletes the bitcoin support keys from the preferences', async () => {
    const oldStorage: VersionedData = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          bitcoinSupportEnabled: true,
          bitcoinTestnetSupportEnabled: true,
        },
      },
    };
    const expectedData = {
      PreferencesController: {},
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(expectedData);
  });
});
