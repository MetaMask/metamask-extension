import { cloneDeep } from 'lodash';
import { migrate, version } from './205';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes legacy GatorPermissionsController 1.x fields', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        GatorPermissionsController: {
          gatorPermissionsMapSerialized: '{}',
          isGatorPermissionsEnabled: true,
          gatorPermissionsProviderSnapId: 'npm:@foo/bar',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.GatorPermissionsController).toStrictEqual({});
    expect(changedControllers).toStrictEqual(
      new Set(['GatorPermissionsController']),
    );
  });

  it('sets status to Active when missing and there is no revocationMetadata', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        GatorPermissionsController: {
          grantedPermissions: [{ id: 'perm-1' }],
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.GatorPermissionsController).toStrictEqual({
      grantedPermissions: [{ id: 'perm-1', status: 'Active' }],
    });
    expect(changedControllers).toStrictEqual(
      new Set(['GatorPermissionsController']),
    );
  });

  it('sets status to Revoked when missing and revocationMetadata is present', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        GatorPermissionsController: {
          grantedPermissions: [
            { id: 'perm-1', revocationMetadata: { recordedAt: 123456 } },
          ],
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.GatorPermissionsController).toStrictEqual({
      grantedPermissions: [
        {
          id: 'perm-1',
          revocationMetadata: { recordedAt: 123456 },
          status: 'Revoked',
        },
      ],
    });
    expect(changedControllers).toStrictEqual(
      new Set(['GatorPermissionsController']),
    );
  });

  it('does not change status when already set', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        GatorPermissionsController: {
          grantedPermissions: [
            {
              id: 'perm-1',
              status: 'Expired',
            },
          ],
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.GatorPermissionsController).toStrictEqual(
      oldStorage.data.GatorPermissionsController,
    );
    expect(changedControllers).toStrictEqual(
      new Set(['GatorPermissionsController']),
    );
  });

  it('removes legacy fields and fills missing statuses on grantedPermissions', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        GatorPermissionsController: {
          gatorPermissionsMapSerialized: '{}',
          isGatorPermissionsEnabled: false,
          gatorPermissionsProviderSnapId: 'npm:@foo/bar',
          grantedPermissions: [
            { id: 'a' },
            { id: 'b', revocationMetadata: {} },
            { id: 'c', status: 'Active' },
          ],
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.GatorPermissionsController).toStrictEqual({
      grantedPermissions: [
        { id: 'a', status: 'Active' },
        { id: 'b', revocationMetadata: {}, status: 'Revoked' },
        { id: 'c', status: 'Active' },
      ],
    });
    expect(changedControllers).toStrictEqual(
      new Set(['GatorPermissionsController']),
    );
  });

  it('records a change when grantedPermissions is an empty array', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        GatorPermissionsController: {
          grantedPermissions: [],
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.GatorPermissionsController).toStrictEqual({
      grantedPermissions: [],
    });
    expect(changedControllers).toStrictEqual(
      new Set(['GatorPermissionsController']),
    );
  });

  it('skips non-object permission entries without throwing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        GatorPermissionsController: {
          grantedPermissions: [null, 'bad', { id: 'ok' }],
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.GatorPermissionsController).toStrictEqual({
      grantedPermissions: [null, 'bad', { id: 'ok', status: 'Active' }],
    });
    expect(changedControllers).toStrictEqual(
      new Set(['GatorPermissionsController']),
    );
  });

  it('does not iterate grantedPermissions when it is not an array', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        GatorPermissionsController: {
          grantedPermissions: 'not-an-array' as unknown as [],
          gatorPermissionsMapSerialized: 'x',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.GatorPermissionsController).toStrictEqual({
      grantedPermissions: 'not-an-array',
    });
    expect(changedControllers).toStrictEqual(
      new Set(['GatorPermissionsController']),
    );
  });

  it('does nothing when GatorPermissionsController is missing', async () => {
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

  it('does nothing when GatorPermissionsController is not an object', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        GatorPermissionsController: 'invalid',
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when controller has no migratable properties', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        GatorPermissionsController: {
          otherKey: 'left-alone',
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
