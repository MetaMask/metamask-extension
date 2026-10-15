import { cloneDeep } from 'lodash';
import { migrate, version } from './221';

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

  it('migrates Infura IPFS gateway to dweb.link', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          ipfsGateway: 'ipfs.infura.io',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.PreferencesController).toStrictEqual({
      ipfsGateway: 'dweb.link',
    });
    expect(changedControllers.has('PreferencesController')).toBe(true);
  });

  it('migrates Infura IPFS URL to dweb.link', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          ipfsGateway: 'https://ipfs.infura.io/ipfs/',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.PreferencesController).toStrictEqual({
      ipfsGateway: 'dweb.link',
    });
    expect(changedControllers.has('PreferencesController')).toBe(true);
  });

  it('does not change non-Infura IPFS gateway', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          ipfsGateway: 'custom.example',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.PreferencesController).toStrictEqual({
      ipfsGateway: 'custom.example',
    });
    expect(changedControllers.has('PreferencesController')).toBe(false);
  });

  it('does not change state if PreferencesController is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual({});
    expect(changedControllers.has('PreferencesController')).toBe(false);
  });

  it('does not change state if PreferencesController is not an object', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: 'invalid',
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual({
      PreferencesController: 'invalid',
    });
    expect(changedControllers.has('PreferencesController')).toBe(false);
  });
});
