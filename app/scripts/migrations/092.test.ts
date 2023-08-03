import { InfuraNetworkType, NetworkType } from '@metamask/controller-utils';
import { migrate, version } from './092';

describe('migration #92', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 91,
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
        version: 91,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if there is no network controller providerConfig state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          id1: {
            foo: 'bar',
          },
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 91,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if there is already a ticker in the providerConfig state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          ticker: 'GoerliETH',
          type: InfuraNetworkType.goerli,
          chainId: '5',
          nickname: 'Goerli Testnet',
          id: 'goerli',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 91,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should update the provider config to have a ticker set to "ETH" if none is currently present', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.rpc,
          chainId: '0x9292',
          nickname: 'Funky Town Chain',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 91,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.rpc,
          chainId: '0x9292',
          nickname: 'Funky Town Chain',
          ticker: 'ETH',
        },
      },
    });
  });
});
