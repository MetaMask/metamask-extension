import { migrate, version } from './085';

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');

  return {
    ...actual,
    v4: jest.fn(),
  };
});

describe('migration #85', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 84,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version,
    });
  });

  it('should return state unaltered if there is no network controller state', async () => {
    const oldData = {
      other: 'data',
    };
    const oldStorage = {
      meta: {
        version: 84,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if there is no network controller previous provider state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        provider: {
          some: 'provider',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 84,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should remove the previous provider state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        previousProviderStore: {
          example: 'config',
        },
        provider: {
          some: 'provider',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 84,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        provider: {
          some: 'provider',
        },
      },
    });
  });
});
