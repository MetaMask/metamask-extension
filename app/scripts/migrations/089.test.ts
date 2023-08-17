import { migrate, version } from './089';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  startSession: jest.fn(),
  endSession: jest.fn(),
  toggleSession: jest.fn(),
  captureException: sentryCaptureExceptionMock,
};

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');

  return {
    ...actual,
    v4: jest.fn(),
  };
});

describe('migration #89', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 88,
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
        version: 88,
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
        version: 88,
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
        version: 88,
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
        version: 88,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NetworkController.providerConfig is undefined`),
    );
  });

  it('should return state unaltered if the providerConfig already has an id', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          id1: {
            foo: 'bar',
          },
        },
        providerConfig: {
          id: 'test',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 88,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if there is no network config with the same rpcUrl and the providerConfig', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          id1: {
            foo: 'bar',
            rpcUrl: 'http://foo.bar',
          },
        },
        providerConfig: {
          rpcUrl: 'http://baz.buzz',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 88,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should update the provider config to have the id of a network config with the same rpcUrl', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          id1: {
            foo: 'bar',
            rpcUrl: 'http://foo.bar',
            id: 'test',
          },
        },
        providerConfig: {
          rpcUrl: 'http://foo.bar',
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 88,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          id1: {
            foo: 'bar',
            rpcUrl: 'http://foo.bar',
            id: 'test',
          },
        },
        providerConfig: {
          rpcUrl: 'http://foo.bar',
          id: 'test',
        },
      },
    });
  });

  it('should update the provider config to have the id of a network config with the same rpcUrl, even if there are other networks with the same chainId', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          id1: {
            foo: 'bar',
            rpcUrl: 'http://fizz.buzz',
            id: 'FAILEDtest',
            chainId: 1,
          },
          id2: {
            foo: 'bar',
            rpcUrl: 'http://foo.bar',
            id: 'PASSEDtest',
          },
          id3: {
            foo: 'bar',
            rpcUrl: 'http://baz.buzz',
            id: 'FAILEDtest',
            chainId: 1,
          },
        },
        providerConfig: {
          rpcUrl: 'http://foo.bar',
          chainId: 1,
        },
      },
    };
    const oldStorage = {
      meta: {
        version: 88,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          id1: {
            foo: 'bar',
            rpcUrl: 'http://fizz.buzz',
            id: 'FAILEDtest',
            chainId: 1,
          },
          id2: {
            foo: 'bar',
            rpcUrl: 'http://foo.bar',
            id: 'PASSEDtest',
          },
          id3: {
            foo: 'bar',
            rpcUrl: 'http://baz.buzz',
            id: 'FAILEDtest',
            chainId: 1,
          },
        },
        providerConfig: {
          rpcUrl: 'http://foo.bar',
          id: 'PASSEDtest',
          chainId: 1,
        },
      },
    });
  });
});
