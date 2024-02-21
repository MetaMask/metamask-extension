import { migrate, version } from './101';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');

  return {
    ...actual,
    v4: jest.fn(),
  };
});

describe('migration #101', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 100,
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
        version: 100,
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
        version: 100,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NetworkController is undefined`),
    );
  });

  it('should return state unaltered if there is no network controller networkId state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        selectedNetworkClientId: 'networkClientId1',
      },
    };
    const oldStorage = {
      meta: {
        version: 100,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should delete the networkId state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        selectedNetworkClientId: 'networkClientId1',
        networkId: '1337',
      },
    };
    const oldStorage = {
      meta: {
        version: 100,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      NetworkController: {
        selectedNetworkClientId: 'networkClientId1',
      },
    });
  });
});
