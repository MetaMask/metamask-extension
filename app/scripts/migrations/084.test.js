import { migrate } from './084';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #84', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const originalVersionedData = buildOriginalVersionedData({
      meta: {
        version: 9999999,
      },
    });

    const newVersionedData = await migrate(originalVersionedData);

    expect(newVersionedData.meta).toStrictEqual({
      version: 84,
    });
  });

  it('does not change the state if the network controller state does not exist', async () => {
    const originalVersionedData = buildOriginalVersionedData({
      data: {
        test: '123',
      },
    });

    const newVersionedData = await migrate(originalVersionedData);

    expect(newVersionedData.data).toStrictEqual(originalVersionedData.data);
  });

  it('captures an exception if the network controller state does not exist', async () => {
    const originalVersionedData = buildOriginalVersionedData({
      data: {
        test: '123',
      },
    });

    await migrate(originalVersionedData);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NetworkController is undefined`),
    );
  });

  const nonObjects = [undefined, null, 'test', 1, ['test']];
  for (const invalidState of nonObjects) {
    it(`does not change the state if the network controller state is ${invalidState}`, async () => {
      const originalVersionedData = buildOriginalVersionedData({
        data: {
          NetworkController: invalidState,
        },
      });

      const newVersionedData = await migrate(originalVersionedData);

      expect(newVersionedData.data).toStrictEqual(originalVersionedData.data);
    });

    it(`captures an exception if the network controller state is ${invalidState}`, async () => {
      const originalVersionedData = buildOriginalVersionedData({
        data: {
          NetworkController: invalidState,
        },
      });

      await migrate(originalVersionedData);

      expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(`typeof state.NetworkController is ${typeof invalidState}`),
      );
    });
  }

  it('does not change the state if the network controller state does not include "network"', async () => {
    const originalVersionedData = buildOriginalVersionedData({
      data: {
        NetworkController: {
          test: '123',
        },
      },
    });

    const newVersionedData = await migrate(originalVersionedData);

    expect(newVersionedData.data).toStrictEqual(originalVersionedData.data);
  });

  it('captures an exception if the network controller state does not include "network" and does not include "networkId"', async () => {
    const originalVersionedData = buildOriginalVersionedData({
      data: {
        NetworkController: {
          test: '123',
        },
      },
    });

    await migrate(originalVersionedData);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NetworkController.network is undefined`),
    );
  });

  it('does not capture an exception if the network controller state does not include "network" but does include "networkId"', async () => {
    const originalVersionedData = buildOriginalVersionedData({
      data: {
        NetworkController: {
          test: '123',
          networkId: 'foobar',
        },
      },
    });

    await migrate(originalVersionedData);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(0);
  });

  it('replaces "network" in the network controller state with "networkId": null, "networkStatus": "unknown" if it is "loading"', async () => {
    const originalVersionedData = buildOriginalVersionedData({
      data: {
        NetworkController: {
          network: 'loading',
        },
      },
    });

    const newVersionedData = await migrate(originalVersionedData);

    expect(newVersionedData.data).toStrictEqual({
      NetworkController: {
        networkId: null,
        networkStatus: 'unknown',
      },
    });
  });

  it('replaces "network" in the network controller state with "networkId": network, "networkStatus": "available" if it is not "loading"', async () => {
    const originalVersionedData = buildOriginalVersionedData({
      data: {
        NetworkController: {
          network: '12345',
        },
      },
    });

    const newVersionedData = await migrate(originalVersionedData);

    expect(newVersionedData.data).toStrictEqual({
      NetworkController: {
        networkId: '12345',
        networkStatus: 'available',
      },
    });
  });
});

function buildOriginalVersionedData({ meta = {}, data = {} } = {}) {
  return {
    meta: { version: 999999, ...meta },
    data: { ...data },
  };
}
