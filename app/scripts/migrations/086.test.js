import { migrate, version } from './086';

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');

  return {
    ...actual,
    v4: jest.fn(),
  };
});

describe('migration #86', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 85,
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
        version: 85,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if there is no network controller provider state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          foo: 'bar',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 85,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should rename the provider config state', async () => {
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
        version: 85,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        providerConfig: {
          some: 'provider',
        },
      },
    });
  });
});
