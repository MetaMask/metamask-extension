import { cloneDeep } from 'lodash';
import { migrate, version } from './201';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('moves `SnapsRegistry` state to `SnapRegistryController`', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        SnapsRegistry: {
          some: 'data',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      SnapRegistryController: {
        some: 'data',
      },
    });

    expect(changedControllers).toStrictEqual(
      new Set(['SnapRegistryController', 'SnapsRegistry']),
    );
  });

  it('does nothing if `SnapsRegistry` is not present', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if `SnapsRegistry` is not an object', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        SnapsRegistry: 'not an object',
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
