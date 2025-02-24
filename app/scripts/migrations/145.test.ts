import { migrate, version } from './145';

const oldVersion = 144;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('does nothing if NetworkOrderController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {},
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({});
    });

    it('does nothing if NetworkOrderController is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkOrderController: 'invalidData',
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('changes network IDs from hex to caip', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkOrderController: {
            orderedNetworkList: [
              { networkId: '0x1' },
              { networkId: '0x5' },
              { networkId: '0x38' },
              { networkId: '0x2105' },
            ],
          },
        },
      };
      const expectedData = {
        NetworkOrderController: {
          orderedNetworkList: [
            { networkId: 'eip155:1' },
            { networkId: 'eip155:5' },
            { networkId: 'eip155:56' },
            { networkId: 'eip155:8453' },
          ],
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('does nothing if NetworkOrderController.orderedNetworkList is not an array', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkOrderController: {
            orderedNetworkList: 'not an array',
          },
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
  });
});
