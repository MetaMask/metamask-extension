import { TESTNETS, migrate, version } from './152.1';

const mockNetworks = {
  'bip122:000000000019d6689c085ae165831e93': {
    chainId: 'bip122:000000000019d6689c085ae165831e93',
    name: 'Bitcoin',
    nativeCurrency: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
    isEvm: false,
  },
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
    chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    name: 'Solana',
    nativeCurrency: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
    isEvm: false,
  },
};

const oldVersion = 152;

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
    it('does nothing if MultichainNetworkController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {},
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({});
    });

    it('does nothing if MultichainNetworkController is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          MultichainNetworkController: 'invalidData',
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('does nothing if MultichainNetworkController.multichainNetworkConfigurationsByChainId is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          MultichainNetworkController: {
            multichainNetworkConfigurationsByChainId: 'not an object',
          },
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('updates the multichainNetworkConfigurationsByChainId to contain test networks', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          MultichainNetworkController: {
            multichainNetworkConfigurationsByChainId: mockNetworks,
          },
        },
      };
      const expectedData = {
        MultichainNetworkController: {
          multichainNetworkConfigurationsByChainId: {
            ...mockNetworks,
            ...TESTNETS,
          },
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
