import { migrate, version } from './168.1';

const oldVersion = 168;

describe(`migration #${version}`, () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  });
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('warns of migration skip when PermissionLogController state is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          foo: 'bar',
        },
      },
    };
    const expectedData = {
      PreferencesController: {
        foo: 'bar',
      },
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(expectedData);
    expect(console.warn).toHaveBeenCalledWith(
      `Migration ${version}: 'PermissionLogController.permissionActivityLog' state not found, skipping migration.`,
    );
  });

  it('warns of migration skip when PermissionLogController.permissionActivityLog state is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionLogController: {
          foo: 'bar',
        },
      },
    };
    const expectedData = {
      PermissionLogController: {
        foo: 'bar',
      },
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(expectedData);
    expect(console.warn).toHaveBeenCalledWith(
      `Migration ${version}: 'PermissionLogController.permissionActivityLog' state not found, skipping migration.`,
    );
  });

  it('deletes PermissionLogController.permissionActivityLog state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionLogController: {
          permissionActivityLog: [{ foo: 'bar' }],
        },
      },
    };
    const expectedData = {
      PermissionLogController: {},
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(expectedData);
  });
});
