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

    it('does nothing if no Infura RPC endpoints are used', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  url: 'https://custom.rpc',
                  type: 'custom',
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

      expect(transformedState.data).toEqual(oldState);
    });

    it('does nothing if Base network configuration is missing', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  url: `https://mainnet.infura.io/v3/${infuraProjectId}`,
                  type: 'infura',
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

      expect(transformedState.data).toEqual(oldState);
    });

    it('replaces "https://mainnet.base.org" if the default RPC endpoint is Infura', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurationsByChainId: {
            [BASE_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  url: 'https://mainnet.base.org',
                  type: 'custom',
                },
              ],
              defaultRpcEndpointIndex: 0,
            },
            '0x1': {
              rpcEndpoints: [
                {
                  url: `https://mainnet.infura.io/v3/${infuraProjectId}`,
                  type: 'infura',
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

    it('does not modify RPC endpoints if the default RPC endpoint is not Infura', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurationsByChainId: {
            [BASE_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  url: 'https://other.rpc',
                  type: 'custom',
                },
              ],
              defaultRpcEndpointIndex: 0,
            },
            '0x1': {
              rpcEndpoints: [
                {
                  url: 'https://custom.rpc',
                  type: 'custom',
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
                },
              ],
              defaultRpcEndpointIndex: 0,
            },
            '0x1': {
              rpcEndpoints: [
                {
                  url: `https://mainnet.infura.io/v3/${infuraProjectId}`,
                  type: 'infura',
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
