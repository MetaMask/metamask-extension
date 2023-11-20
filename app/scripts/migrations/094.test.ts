import { NetworkType } from '@metamask/controller-utils';
import { NetworkStatus } from '@metamask/network-controller';
import { migrate, version } from './094';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  startSession: jest.fn(),
  endSession: jest.fn(),
  toggleSession: jest.fn(),
  captureException: sentryCaptureExceptionMock,
};

describe('migration #94', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 93,
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
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should capture an exception if there is no network controller state', async () => {
    const oldData = {
      other: 'data',
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NetworkController is undefined`),
    );
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
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should capture an exception if there is no network controller providerConfig state', async () => {
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
        version: 93,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NetworkController.providerConfig is undefined`),
    );
  });

  it('should capture an exception if there is no providerConfig.id and no providerConfig.type value in state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          ticker: 'NET',
          chainId: '0x189123',
          nickname: 'A Network',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `typeof state.NetworkController.providerConfig.id is undefined and state.NetworkController.providerConfig.type is undefined`,
      ),
    );
  });

  it('should not capture an exception if there is a providerConfig.id in state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          ticker: 'NET',
          chainId: '0x189123',
          nickname: 'A Network',
          id: 'foobar',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(0);
  });

  it(`should capture an exception if there is no providerConfig.id and the providerConfig.type value is ${NetworkType.rpc} in state`, async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          ticker: 'NET',
          chainId: '0x189123',
          nickname: 'A Network',
          type: NetworkType.rpc,
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `typeof state.NetworkController.providerConfig.id is undefined and state.NetworkController.providerConfig.type is ${NetworkType.rpc}`,
      ),
    );
  });

  it(`should not capture an exception if there is no providerConfig.id and the providerConfig.type value is not ${NetworkType.rpc} in state`, async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          ticker: 'NET',
          chainId: '0x189123',
          nickname: 'A Network',
          type: 'NOT_AN_RPC_TYPE',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(0);
  });

  it('should return state unaltered if there is a providerConfig.id value in state but it is not a string', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          ticker: 'NET',
          type: NetworkType.rpc,
          chainId: '0x189123',
          nickname: 'A Network',
          id: { not: 'a string' },
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if there is a providerConfig.type value in state but it equals NetworkType.rpc and there is no providerConfig.id value in state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          ticker: 'ETH',
          type: NetworkType.rpc,
          chainId: '0x189123',
          nickname: 'A Network',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should add a selectedNetworkClientId property and a default networksMetadata object to the NetworkController state if there is a providerConfig.id value in state and it is a string (and there are no networkStatus or networkDetails values)', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          ticker: 'NET',
          type: NetworkType.rpc,
          chainId: '0x189123',
          nickname: 'A Network',
          id: 'test-network-client-id',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data.NetworkController).toStrictEqual({
      providerConfig: {
        ticker: 'NET',
        type: NetworkType.rpc,
        chainId: '0x189123',
        nickname: 'A Network',
        id: 'test-network-client-id',
      },
      networksMetadata: {
        'test-network-client-id': {
          EIPS: {},
          status: NetworkStatus.Unknown,
        },
      },
      selectedNetworkClientId: 'test-network-client-id',
    });
  });

  it('should add a selectedNetworkClientId property and a default networksMetadata object to the NetworkController state if there is a providerConfig.type value in state and it is not NetworkType.rpc (and there are no networkStatus or networkDetails values)', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          ticker: 'sepoliaETH',
          type: NetworkType.sepolia,
          chainId: '0xaa36a7',
          nickname: 'Sepolia TestNet',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data.NetworkController).toStrictEqual({
      providerConfig: {
        ticker: 'sepoliaETH',
        type: NetworkType.sepolia,
        chainId: '0xaa36a7',
        nickname: 'Sepolia TestNet',
      },
      networksMetadata: {
        [NetworkType.sepolia]: {
          EIPS: {},
          status: NetworkStatus.Unknown,
        },
      },
      selectedNetworkClientId: NetworkType.sepolia,
    });
  });

  it('should migrate networkStatus into networksMetadata keyed by the active providerConfig.id value, calling the new value "status" and deleting the root networkStatus value', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.rpc,
          chainId: '0x9393',
          nickname: 'Funky Town Chain',
          ticker: 'ETH',
          id: 'test-network-client-id',
        },
        networkStatus: NetworkStatus.Available,
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.rpc,
          chainId: '0x9393',
          nickname: 'Funky Town Chain',
          ticker: 'ETH',
          id: 'test-network-client-id',
        },
        networksMetadata: {
          'test-network-client-id': {
            status: NetworkStatus.Available,
            EIPS: {},
          },
        },
        selectedNetworkClientId: 'test-network-client-id',
      },
    });
  });

  it('should migrate networkStatus into networksMetadata keyed by the active providerConfig.type value (if providerConfig.type is not NetworkType.rpc), calling the new value "status" and deleting the root networkStatus value', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.sepolia,
          ticker: 'sepoliaETH',
          chainId: '0xaa36a7',
          nickname: 'Sepolia TestNet',
        },
        networkStatus: NetworkStatus.Available,
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.sepolia,
          ticker: 'sepoliaETH',
          chainId: '0xaa36a7',
          nickname: 'Sepolia TestNet',
        },
        networksMetadata: {
          [NetworkType.sepolia]: {
            status: NetworkStatus.Available,
            EIPS: {},
          },
        },
        selectedNetworkClientId: NetworkType.sepolia,
      },
    });
  });

  it('should migrate the contents of networkDetails into networksMetadata keyed by the active providerConfig.id value, and delete the root networkDetails value', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.rpc,
          chainId: '0x9393',
          nickname: 'Funky Town Chain',
          ticker: 'ETH',
          id: 'test-network-client-id',
        },
        networkDetails: {
          EIPS: { 1559: false },
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.rpc,
          chainId: '0x9393',
          nickname: 'Funky Town Chain',
          ticker: 'ETH',
          id: 'test-network-client-id',
        },
        networksMetadata: {
          'test-network-client-id': {
            status: NetworkStatus.Unknown,
            EIPS: {
              1559: false,
            },
          },
        },
        selectedNetworkClientId: 'test-network-client-id',
      },
    });
  });

  it('should migrate the contents of networkDetails into networksMetadata keyed by the active providerConfig.type (if providerConfig.type does not equal NetworkType.rpc) value, and delete the root networkDetails value', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.sepolia,
          ticker: 'sepoliaETH',
          chainId: '0xaa36a7',
          nickname: 'Sepolia TestNet',
        },
        networkDetails: {
          EIPS: { 1559: false },
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.sepolia,
          ticker: 'sepoliaETH',
          chainId: '0xaa36a7',
          nickname: 'Sepolia TestNet',
        },
        networksMetadata: {
          [NetworkType.sepolia]: {
            status: NetworkStatus.Unknown,
            EIPS: { 1559: false },
          },
        },
        selectedNetworkClientId: NetworkType.sepolia,
      },
    });
  });

  it('should migrate both networkStatus and networkDetails state into networksMetadata keyed by the active providerConfig.id value', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.rpc,
          chainId: '0x9393',
          nickname: 'Funky Town Chain',
          ticker: 'ETH',
          id: 'test-network-client-id',
        },
        networkStatus: NetworkStatus.Available,
        networkDetails: {
          EIPS: { 1559: false },
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.rpc,
          chainId: '0x9393',
          nickname: 'Funky Town Chain',
          ticker: 'ETH',
          id: 'test-network-client-id',
        },
        networksMetadata: {
          'test-network-client-id': {
            status: NetworkStatus.Available,
            EIPS: { 1559: false },
          },
        },
        selectedNetworkClientId: 'test-network-client-id',
      },
    });
  });

  it('should migrate both networkStatus and networkDetails state into networksMetadata keyed by the active providerConfig.type (if providerConfig.type does not equal NetworkType.rpc)', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.sepolia,
          ticker: 'sepoliaETH',
          chainId: '0xaa36a7',
          nickname: 'Sepolia TestNet',
        },
        networkStatus: NetworkStatus.Available,
        networkDetails: {
          EIPS: { 1559: false },
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        providerConfig: {
          type: NetworkType.sepolia,
          ticker: 'sepoliaETH',
          chainId: '0xaa36a7',
          nickname: 'Sepolia TestNet',
        },
        networksMetadata: {
          [NetworkType.sepolia]: {
            status: NetworkStatus.Available,
            EIPS: { 1559: false },
          },
        },
        selectedNetworkClientId: NetworkType.sepolia,
      },
    });
  });
});
