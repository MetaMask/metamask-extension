import { migrate, version } from './111';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #111', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 110 },
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
      meta: { version: 110 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('resets domains if SelectedNetworkController state is present', async () => {
    const oldState = {
      SelectedNetworkController: {
        perDomainNetwork: true,
        domains: {
          metamask: 'ropsten',
          otherDomain: 'value',
        },
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        perDomainNetwork: true,
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: 110 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('resets domains if existing state only contains metamask', async () => {
    const oldState = {
      SelectedNetworkController: {
        perDomainNetwork: false,
        domains: {
          metamask: 'mainnet',
        },
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        perDomainNetwork: false,
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: 110 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('handles complex state transformations correctly', async () => {
    const oldState = {
      SelectedNetworkController: {
        perDomainNetwork: false,
        domains: {
          metamask: 'kovan',
          otherDomain1: 'value1',
          otherDomain2: 'value2',
        },
      },
      OtherController: {
        someData: 'dataValue',
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        perDomainNetwork: false,
        domains: {},
      },
      OtherController: {
        someData: 'dataValue', // Other data remains unchanged
      },
    };

    const transformedState = await migrate({
      meta: { version: 110 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('should capture an exception if SelectedNetworkController is in state but is not an object', async () => {
    const oldData = {
      other: 'data',
      SelectedNetworkController: {
        perDomainNetwork: false,
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `state.SelectedNetworkController.domains is missing from SelectedNetworkController state`,
      ),
    );
  });

  it('should capture an exception if SelectedNetworkController is in state but there is no domains property', async () => {
    const oldData = {
      other: 'data',
      SelectedNetworkController: 'not an object',
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`state.SelectedNetworkController is type: string`),
    );
  });

  it('should capture an exception if SelectedNetworkController has domains property but it is not an object', async () => {
    const oldData = {
      other: 'data',
      SelectedNetworkController: {
        perDomainNetwork: false,
        domains: 'not an object',
      },
    };
    const oldStorage = {
      meta: {
        version: 93,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`state.SelectedNetworkController.domains is type: string`),
    );
  });
});
