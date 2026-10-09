import { cloneDeep } from 'lodash';
import { migrate, version } from './231';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

describe(`migration #${VERSION}`, () => {
  it('bumps the version', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('sets needsSocialPairing to true when it was false and keeps other fields', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: {
          isSignedIn: true,
          needsProfilePairing: false,
          needsSocialPairing: false,
          srpSessionData: { id: { accessToken: 'token' } },
        },
        OtherController: { preserved: true },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual({
      AuthenticationController: {
        isSignedIn: true,
        needsProfilePairing: false,
        needsSocialPairing: true,
        srpSessionData: { id: { accessToken: 'token' } },
      },
      OtherController: { preserved: true },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['AuthenticationController']),
    );
  });

  it('sets needsSocialPairing to true when the field is absent', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: { AuthenticationController: { isSignedIn: false } },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual({
      AuthenticationController: { isSignedIn: false, needsSocialPairing: true },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['AuthenticationController']),
    );
  });

  it('keeps needsSocialPairing true when it is already true', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: { AuthenticationController: { needsSocialPairing: true } },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.data).toStrictEqual({
      AuthenticationController: { needsSocialPairing: true },
    });
  });

  it('does not change state when AuthenticationController is absent', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: { OtherController: { preserved: true } },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does not change state when AuthenticationController is not an object', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: { AuthenticationController: 'invalid' },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });
});
