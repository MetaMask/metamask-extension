import { migrate, version } from './113';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #113', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 112 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if PreferencesController is not present', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: 112 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('update the useNativeCurrencyAsPrimaryCurrency property', async () => {
    const oldState = {
      PreferencesController: {
        preferences: {
          useNativeCurrencyAsPrimaryCurrency: false,
        },
      },
    };

    const expectedState = {
      PreferencesController: {
        preferences: {
          useNativeCurrencyAsPrimaryCurrency: true,
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: 112 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('should capture an exception if PreferencesController is in state but is not an object', async () => {
    const oldData = {
      PreferencesController: 'test',
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
      new Error(`state.PreferencesController is type: string`),
    );
  });

  it('should capture an exception if PreferencesController.preferences.useNativeCurrencyAsPrimaryCurrency is in state but is not a boolean', async () => {
    const oldData = {
      PreferencesController: {
        preferences: {
          useNativeCurrencyAsPrimaryCurrency: 'test',
        },
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
        `state.PreferencesController.useNativeCurrencyAsPrimaryCurrency is type: string`,
      ),
    );
  });

  it('should capture an exception if PreferencesController is in state but there is no preferences property', async () => {
    const oldData = {
      other: 'data',
      PreferencesController: {},
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
        `state.PreferencesController.preferences is missing from PreferencesController state`,
      ),
    );
  });

  it('should capture an exception if PreferencesController.preferences is in state but there is no useNativeCurrencyAsPrimaryCurrency property', async () => {
    const oldData = {
      other: 'data',
      PreferencesController: {
        preferences: {},
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
        `state.PreferencesController.preferences.useNativeCurrencyAsPrimaryCurrency is missing from PreferencesController state`,
      ),
    );
  });
});
