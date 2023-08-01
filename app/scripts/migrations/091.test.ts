import { cloneDeep } from 'lodash';
import { migrate, version } from './091';

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');

  return {
    ...actual,
    v4: jest.fn(),
  };
});

describe('migration #91', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 90,
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
        version: 90,
      },
      data: oldData,
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if there is no network controller networkConfigurations state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          foo: 'bar',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 90,
      },
      data: oldData,
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if the networkConfigurations all have a chainId', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          id1: {
            foo: 'bar',
            chainId: '0x1',
          },
          id2: {
            fizz: 'buzz',
            chainId: '0x2',
          },
        },
        providerConfig: {
          id: 'test',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 90,
      },
      data: oldData,
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should delete networks that have an undefined or null chainId', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          id1: {
            foo: 'bar',
            chainId: '0x1',
          },
          id2: {
            fizz: 'buzz',
            chainId: '0x2',
          },
          id3: {
            buzz: 'baz',
            chainId: undefined,
          },
          id4: {
            foo: 'bar',
            chainId: null,
          },
          id5: {
            fizz: 'buzz',
          },
        },
        providerConfig: {
          rpcUrl: 'http://foo.bar',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 90,
      },
      data: oldData,
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          id1: {
            foo: 'bar',
            chainId: '0x1',
          },
          id2: {
            fizz: 'buzz',
            chainId: '0x2',
          },
        },
        providerConfig: {
          rpcUrl: 'http://foo.bar',
        },
      },
    });
  });
});
