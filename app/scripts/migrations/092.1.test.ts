import { cloneDeep } from 'lodash';
import { migrate, version } from './092.1';

const PREVIOUS_VERSION = 92;

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  startSession: jest.fn(),
  endSession: jest.fn(),
  toggleSession: jest.fn(),
  captureException: sentryCaptureExceptionMock,
};

describe('migration #92.1', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version,
    });
  });

  it('should return state unaltered if there is no TokenListController state', async () => {
    const oldData = {
      other: 'data',
    };
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: oldData,
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('captures an exception if the TokenListController state is invalid', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: { TokenListController: 'this is not valid' },
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.TokenListController is string`),
    );
  });

  it('should return state unaltered if there is no TokenListController tokensChainsCache state', async () => {
    const oldData = {
      other: 'data',
      TokenListController: {
        tokenList: {},
      },
    };
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: oldData,
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if the tokensChainsCache state is an unexpected type', async () => {
    const oldData = {
      other: 'data',
      TokenListController: {
        tokensChainsCache: 'unexpected string',
      },
    };
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: oldData,
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if the tokensChainsCache state is valid', async () => {
    const oldData = {
      other: 'data',
      TokenListController: {
        tokensChainsCache: {},
      },
    };
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: oldData,
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should remove undefined tokensChainsCache state', async () => {
    const oldData = {
      other: 'data',
      TokenListController: {
        tokensChainsCache: undefined,
      },
    };
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: oldData,
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      TokenListController: {},
    });
  });
});
