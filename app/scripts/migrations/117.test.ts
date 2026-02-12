import { migrate, version } from './117';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #117', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 116 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if SelectedNetworkController is not present', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: 116 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('removes domains with npm: or local: prefixes and preserves other domains', async () => {
    const oldState = {
      SelectedNetworkController: {
        domains: {
          'npm:package': 'network1',
          'local:development': 'network2',
          otherDomain: 'network3',
        },
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        domains: {
          otherDomain: 'network3',
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: 116 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('keeps the domains unchanged if there are no npm: or local: prefixes', async () => {
    const oldState = {
      SelectedNetworkController: {
        domains: {
          someDomain: 'network1',
          anotherDomain: 'network2',
        },
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        domains: {
          someDomain: 'network1',
          anotherDomain: 'network2',
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: 116 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('should capture an exception if SelectedNetworkController is in state but is not an object', async () => {
    const oldData = {
      SelectedNetworkController: 'not an object',
    };
    const oldStorage = {
      meta: {
        version: 116,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error('SelectedNetworkController is not an object.'),
    );
  });

  it('should capture an exception if SelectedNetworkController has domains but it is not an object', async () => {
    const oldData = {
      SelectedNetworkController: {
        domains: 'not an object',
      },
    };
    const oldStorage = {
      meta: {
        version: 116,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error('Domains state is not an object.'),
    );
  });
});
