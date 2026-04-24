import { cloneDeep } from 'lodash';
import { migrate, version } from './207';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('resets isSignedIn from true to false', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: {
          isSignedIn: true,
          srpSessionData: { 'srp-1': { token: 'cached-token' } },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.AuthenticationController).toStrictEqual({
      isSignedIn: false,
      srpSessionData: { 'srp-1': { token: 'cached-token' } },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['AuthenticationController']),
    );
  });

  it('preserves srpSessionData untouched', async () => {
    const srpSessionData = {
      'srp-1': { token: 'token-1', profile: { profileId: 'p1' } },
      'srp-2': { token: 'token-2', profile: { profileId: 'p2' } },
    };
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: {
          isSignedIn: true,
          srpSessionData,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.data.AuthenticationController).toStrictEqual({
      isSignedIn: false,
      srpSessionData,
    });
  });

  it('does nothing when AuthenticationController is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        SomeOtherController: {},
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when AuthenticationController is not an object', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: 'invalid',
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when isSignedIn is already false', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: {
          isSignedIn: false,
          srpSessionData: {},
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when isSignedIn property is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: {
          srpSessionData: {},
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });
});
