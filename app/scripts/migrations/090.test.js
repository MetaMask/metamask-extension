import { migrate, version } from './090';

const PREVIOUS_VERSION = version - 1;

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #90', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
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

  it('does not change the state if the phishing controller state does not exist', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: { test: '123' },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
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

  it('does not change the state if the listState property does not exist', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: {
        PhishingController: { test: 123 },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('deletes the "listState" property', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: { PhishingController: { listState: {} } },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.PhishingController.listState).toBeUndefined();
  });

  it('deletes the listState if present', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: { PhishingController: { listState: { test: 123 } } },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PhishingController: {},
    });
  });

  it('does not delete the allowlist if present', async () => {
    const oldStorage = {
      meta: {
        version: PREVIOUS_VERSION,
      },
      data: {
        PhishingController: {
          whitelist: ['foobar.com'],
          listState: { test: 123 },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PhishingController: { whitelist: ['foobar.com'] },
    });
  });
});
