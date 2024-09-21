import { cloneDeep } from 'lodash';
import { migrate, version } from './092';

const PREVIOUS_VERSION = version - 1;

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  startSession: jest.fn(),
  endSession: jest.fn(),
  toggleSession: jest.fn(),
  captureException: sentryCaptureExceptionMock,
};

describe('migration #92', () => {
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

  it('should return state unaltered if there is no phishing controller state', async () => {
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

  it('captures an exception if the phishing controller state is invalid', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: { PhishingController: 'this is not valid' },
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.PhishingController is string`),
    );
  });

  it('should return state unaltered if there is no phishing controller last fetched state', async () => {
    const oldData = {
      other: 'data',
      PhishingController: {
        whitelist: [],
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

  it('should remove both last fetched properties from phishing controller state', async () => {
    const oldData = {
      other: 'data',
      PhishingController: {
        whitelist: [],
        hotlistLastFetched: 0,
        stalelistLastFetched: 0,
      },
    };
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      PhishingController: {
        whitelist: [],
      },
    });
  });
});
