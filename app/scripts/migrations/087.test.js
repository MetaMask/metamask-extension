import { migrate, version } from './087';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #87', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version,
    });
  });

  it('should return state unaltered if there is no tokens controller state', async () => {
    const oldData = {
      other: 'data',
    };
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if there is no tokens controller suggested assets state', async () => {
    const oldData = {
      other: 'data',
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        tokens: [],
      },
    };
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if TokensController state is not an object', async () => {
    const oldData = {
      other: 'data',
      TokensController: false,
    };
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should capture an exception if TokensController state is not an object', async () => {
    const oldData = {
      other: 'data',
      TokensController: false,
    };
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.TokensController is boolean`),
    );
  });

  it('should not capture an exception if TokensController state is an object', async () => {
    const oldData = {
      other: 'data',
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        suggestedAssets: [],
        tokens: [],
      },
    };
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(0);
  });

  it('should remove the suggested assets state', async () => {
    const oldData = {
      other: 'data',
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        suggestedAssets: [],
        tokens: [],
      },
    };
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        tokens: [],
      },
    });
  });
});
