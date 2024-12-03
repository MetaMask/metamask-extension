import { cloneDeep } from 'lodash';
import { NetworkState } from '@metamask/network-controller';
import { infuraProjectId } from '../../../shared/constants/network';
import { migrate, version } from './135';

const oldVersion = 134;
const BASE_CHAIN_ID = '0x2105';

describe('migration #135', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('Base Network Migration', () => {
    it('does nothing if networkConfigurationsByChainId is not in state', async () => {
      const oldState = {
        OtherController: {},
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('replaces "https://mainnet.base.org" with "base-mainnet.infura.io" when it exists', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurationsByChainId: {
            [BASE_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  url: 'https://mainnet.base.org',
                  type: 'custom',
                  networkClientId: 'base-mainnet',
                },
              ],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      const updatedNetworkController = transformedState.data
        .NetworkController as NetworkState;

      expect(
        updatedNetworkController.networkConfigurationsByChainId[BASE_CHAIN_ID]
          .rpcEndpoints[0].url,
      ).toEqual(`https://base-mainnet.infura.io/v3/${infuraProjectId}`);
    });

    it('does not modify RPC endpoints other than "https://mainnet.base.org"', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurationsByChainId: {
            [BASE_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  url: 'https://other.rpc',
                  type: 'custom',
                  networkClientId: 'other-mainnet',
                },
              ],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      const updatedNetworkController = transformedState.data
        .NetworkController as NetworkState;

      expect(
        updatedNetworkController.networkConfigurationsByChainId[BASE_CHAIN_ID]
          .rpcEndpoints[0].url,
      ).toEqual('https://other.rpc');
    });

    it('keeps defaultRpcEndpointIndex unchanged when replacing "https://mainnet.base.org"', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurationsByChainId: {
            [BASE_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  url: 'https://mainnet.base.org',
                  type: 'custom',
                  networkClientId: 'base-mainnet',
                },
              ],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      const updatedNetworkController = transformedState.data
        .NetworkController as NetworkState;

      expect(
        updatedNetworkController.networkConfigurationsByChainId[BASE_CHAIN_ID]
          .defaultRpcEndpointIndex,
      ).toEqual(0);
    });
  });
});
