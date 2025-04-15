import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { BtcScope, SolScope } from '@metamask/keyring-api';
import { migrate, version } from './154';

const oldVersion = 153;

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

    it.only('updates the multichainNetworkConfigurationsByChainId to contain test networks', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          MultichainNetworkController: {
            multichainNetworkConfigurationsByChainId: {
              [BtcScope.Mainnet]:
                AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS[BtcScope.Mainnet],
              [SolScope.Mainnet]:
                AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS[SolScope.Mainnet],
            },
          },
        },
      };
      const expectedData = {
        MultichainNetworkController: {
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
