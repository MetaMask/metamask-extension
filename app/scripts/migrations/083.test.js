import { migrate } from './081';

describe('migration #81', () => {
  it('updates the version metadata', async () => {
    const originalVersionedData = {
      meta: {
        version: 80,
      },
      data: {},
    };

    const newVersionedData = await migrate(originalVersionedData);

    expect(newVersionedData.meta).toStrictEqual({
      version: 81,
    });
  });

  it('does not change the state if the network controller state does not exist', async () => {
    const originalVersionedData = {
      meta: {
        version: 80,
      },
      data: {
        test: '123',
      },
    };

    const newVersionedData = await migrate(originalVersionedData);

    expect(newVersionedData.data).toStrictEqual(originalVersionedData.data);
  });

  const nonObjects = [undefined, null, 'test', 1, ['test']];
  for (const invalidState of nonObjects) {
    it(`does not change the state if the network controller state is ${invalidState}`, async () => {
      const originalVersionedData = {
        meta: {
          version: 80,
        },
        data: {
          NetworkController: invalidState,
        },
      };

      const newVersionedData = await migrate(originalVersionedData);

      expect(newVersionedData.data).toStrictEqual(originalVersionedData.data);
    });
  }

  it('does not change the state if the network controller state does not include "network"', async () => {
    const originalVersionedData = {
      meta: {
        version: 80,
      },
      data: {
        NetworkController: {
          test: '123',
        },
      },
    };

    const newVersionedData = await migrate(originalVersionedData);

    expect(newVersionedData.data).toStrictEqual(originalVersionedData.data);
  });

  it('replaces "network" in the network controller state with "networkStatus": "unknown" if it is "loading"', async () => {
    const originalVersionedData = {
      meta: {
        version: 80,
      },
      data: {
        NetworkController: {
          network: 'loading',
        },
      },
    };

    const newVersionedData = await migrate(originalVersionedData);

    expect(newVersionedData.data).toStrictEqual({
      NetworkController: {
        networkStatus: 'unknown',
      },
    });
  });

  it('replaces "network" in the network controller state with "networkStatus": "available" if it is not "loading"', async () => {
    const originalVersionedData = {
      meta: {
        version: 80,
      },
      data: {
        NetworkController: {
          network: '12345',
        },
      },
    };

    const newVersionedData = await migrate(originalVersionedData);

    expect(newVersionedData.data).toStrictEqual({
      NetworkController: {
        networkStatus: 'available',
      },
    });
  });
});
