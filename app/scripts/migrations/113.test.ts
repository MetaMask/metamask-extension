import { migrate, version } from './113';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #113', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 112,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version,
    });
  });

  it('should deprecate transactionSecurityCheckEnabled in PreferencesController', async () => {
    const oldStorage = {
      PreferencesController: {
        transactionSecurityCheckEnabled: true,
      },
    };

    const expectedState = {
      PreferencesController: {},
    };

    const transformedState = await migrate({
      meta: { version: 112 },
      data: oldStorage,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('should not change state in controllers other than PreferencesController', async () => {
    const oldStorage = {
      meta: {
        version: 112,
      },
      data: {
        PreferencesController: {
          securityAlertsEnabled: false,
        },
        data: {
          FooController: { a: 'b' },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version,
      },
      data: {
        PreferencesController: {
          securityAlertsEnabled: false,
        },
        data: {
          FooController: { a: 'b' },
        },
      },
    });
  });

  it('should preserve other PreferencesController state', async () => {
    const oldStorage = {
      meta: {
        version: 112,
      },
      data: {
        PreferencesController: {
          currentLocale: 'en',
          dismissSeedBackUpReminder: false,
          securityAlertsEnabled: false,
          openSeaEnabled: false,
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version,
      },
      data: {
        PreferencesController: {
          currentLocale: 'en',
          dismissSeedBackUpReminder: false,
          securityAlertsEnabled: false,
          openSeaEnabled: false,
        },
      },
    });
  });

  it('should capture an exception if PreferencesController.transactionSecurityCheckEnabled is in state but is not a boolean', async () => {
    const oldData = {
      other: 'data',
      PreferencesController: {
        transactionSecurityCheckEnabled: 123,
      },
    };
    const oldStorage = {
      meta: {
        version: 112,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `state.PreferencesController.transactionSecurityCheckEnabled is type: number`,
      ),
    );
  });
});
