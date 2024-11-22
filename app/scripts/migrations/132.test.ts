import { AccountsControllerState } from '@metamask/accounts-controller';
import { cloneDeep } from 'lodash';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { migrate, version } from './132';

const oldVersion = 131;

const mockSnapControllerState = {
  snaps: {
    foobar: {
      id: 'foobar',
    },
  },
};

const mockPermissionControllerState = {
  subjects: {
    foobar: {
      permissions: {
        snap_manageAccounts: {},
      },
    },
  },
};

describe(`migration #${version}`, () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        SnapController: mockSnapControllerState,
        PermissionController: mockPermissionControllerState,
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if SnapController is not present', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: mockPermissionControllerState,
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if PermissionController is not present', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        SnapController: mockSnapControllerState,
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if there is no snaps', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        SnapController: {},
        PermissionController: mockPermissionControllerState,
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if there are no permission subjects', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        SnapController: mockSnapControllerState,
        PermissionController: {},
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if the snap does not have a corresponding permission subject', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        SnapController: {
          snaps: {
            foobar: {
              id: 'foobar',
            },
          },
        },
        PermissionController: {
          subjects: {},
        },
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if the snap does not have a snap_manageAccounts permission', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        SnapController: {
          snaps: {
            foobar: {
              id: 'foobar',
            },
          },
        },
        PermissionController: {
          subjects: {
            foobar: {
              permissions: {
                snap_notify: {},
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('removes the snap_manageAccounts permission from the snap', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        SnapController: mockSnapControllerState,
        PermissionController: {
          subjects: {
            foobar: {
              permissions: {
                snap_notify: {},
                snap_manageAccounts: {},
              },
            },
          },
        },
      },
    };

    const expectedData = {
      SnapController: mockSnapControllerState,
      PermissionController: {
        subjects: {
          foobar: {
            permissions: {
              snap_notify: {},
            },
          },
        },
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(expectedData);
  });
});
