import { migrate, version } from './086';

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

describe('migration #86', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

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

  it('should capture an exception if there is no network controller state', async () => {
    const oldData = {
      other: 'data',
    };
    const oldStorage = {
      meta: {
        version: 85,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NetworkController is undefined`),
    );
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

  it('should capture an exception if there is no network controller provider state and no providerConfig state', async () => {
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

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NetworkController.provider is undefined`),
    );
  });

  it('should not capture an exception if there is no network controller provider state but there is a providerConfig state', async () => {
    const oldData = {
      other: 'data',
      NetworkController: {
        networkConfigurations: {
          foo: 'bar',
        },
        providerConfig: {},
      },
    };
    const oldStorage = {
      meta: {
        version: 85,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(0);
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
