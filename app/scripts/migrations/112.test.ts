import { migrate, version } from './112';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #112', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 111 },
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
      meta: { version: 111 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('deletes the perDomainNetwork property', async () => {
    const oldState = {
      SelectedNetworkController: {
        perDomainNetwork: true,
        domains: {},
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: 111 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('should capture an exception if SelectedNetworkController.perDomainNetwork is in state but is not a boolean', async () => {
    const oldData = {
      other: 'data',
      SelectedNetworkController: {
        perDomainNetwork: 123,
        domains: {},
      },
    };
    const oldStorage = {
      meta: {
        version: 111,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `state.SelectedNetworkController.perDomainNetwork is type: number`,
      ),
    );
  });

  it('should capture an exception if SelectedNetworkController is in state but there is no perDomainNetwork property', async () => {
    const oldData = {
      other: 'data',
      SelectedNetworkController: {
        domains: {},
      },
    };
    const oldStorage = {
      meta: {
        version: 111,
      },
      data: oldData,
    };

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `state.SelectedNetworkController.perDomainNetwork is missing from SelectedNetworkController state`,
      ),
    );
  });
});
