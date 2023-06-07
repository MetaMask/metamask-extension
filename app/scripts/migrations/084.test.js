import { migrate } from './084';

describe('migration #84', () => {
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
