import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../constants';
import {
  CONVERSION_RATE_NETWORKS,
  NON_ZERO_NATIVE_NETWORKS,
  type CustomNetworkId,
  prepareCustomNetwork,
} from './custom-network-harness';

const NON_ZERO_NATIVE_NETWORK_CASES: {
  id: CustomNetworkId;
  chainIdHex: string;
  clientId: string;
  nativeAssetId: string;
  nativeCurrency: string;
}[] = [
  {
    id: 'rootstock',
    chainIdHex: '0x1e',
    clientId: 'rootstock-local',
    nativeAssetId: 'eip155:30/slip44:60',
    nativeCurrency: 'RBTC',
  },
  {
    id: 'stable',
    chainIdHex: '0x3dc',
    clientId: 'stable-local',
    nativeAssetId:
      'eip155:988/erc20:0x0000000000000000000000000000000000000000',
    nativeCurrency: 'USDT0',
  },
  {
    id: 'mantle',
    chainIdHex: '0x1388',
    clientId: 'mantle-local',
    nativeAssetId:
      'eip155:5000/erc20:0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000',
    nativeCurrency: 'MNT',
  },
  {
    id: 'metis',
    chainIdHex: '0x440',
    clientId: 'metis-local',
    nativeAssetId:
      'eip155:1088/erc20:0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000',
    nativeCurrency: 'METIS',
  },
  {
    id: 'gnosis',
    chainIdHex: '0x64',
    clientId: 'gnosis-local',
    nativeAssetId:
      'eip155:100/erc20:0x0000000000000000000000000000000000000000',
    nativeCurrency: 'XDAI',
  },
];

function networkController(
  fixtures: ReturnType<typeof prepareCustomNetwork>['fixtures'],
) {
  return fixtures.data.NetworkController as {
    selectedNetworkClientId: string;
    networkConfigurationsByChainId: Record<
      string,
      { chainId: string; nativeCurrency: string }
    >;
  };
}

function enabledEip155(
  fixtures: ReturnType<typeof prepareCustomNetwork>['fixtures'],
) {
  return (
    fixtures.data.NetworkEnablementController as {
      enabledNetworkMap: { eip155: Record<string, boolean> };
    }
  ).enabledNetworkMap.eip155;
}

describe('custom-network-harness', () => {
  describe('prepareCustomNetwork', () => {
    it('injects XDC and enables only that chain for native send', () => {
      const { fixtures, network } = prepareCustomNetwork('xdc', 'nativeSend');

      expect(networkController(fixtures).selectedNetworkClientId).toBe(
        'xdc-local',
      );
      expect(
        networkController(fixtures).networkConfigurationsByChainId['0x32']
          ?.nativeCurrency,
      ).toBe('XDC');
      expect(enabledEip155(fixtures)).toStrictEqual({ '0x32': true });
      expect(network.nativeSymbol).toBe('XDC');
    });

    it('enables XDC and Mainnet together for the dual-network scenario', () => {
      const { fixtures } = prepareCustomNetwork('xdc', 'dualNetworkWithErc20');

      expect(enabledEip155(fixtures)).toStrictEqual({
        '0x32': true,
        '0x1': true,
      });
    });

    it('seeds the UI native asset id for conversion-rate networks', () => {
      const { fixtures, network } = prepareCustomNetwork(
        'injective',
        'conversionRate',
      );
      const assetsController = fixtures.data.AssetsController as {
        assetsBalance: Record<string, Record<string, { amount: string }>>;
      };

      expect(
        assetsController.assetsBalance[DEFAULT_FIXTURE_ACCOUNT_ID]?.[
          network.uiNativeAssetId
        ]?.amount,
      ).toBe('25');
      expect(network.uiNativeAssetId).toBe('eip155:1776/slip44:22000119');
    });

    it('seeds the UI native asset id for native send', () => {
      const { fixtures, network } = prepareCustomNetwork(
        'injective',
        'nativeSend',
      );
      const assetsController = fixtures.data.AssetsController as {
        assetsBalance: Record<string, Record<string, { amount: string }>>;
      };

      expect(
        assetsController.assetsBalance[DEFAULT_FIXTURE_ACCOUNT_ID]?.[
          network.uiNativeAssetId
        ]?.amount,
      ).toBe('25');
      expect(network.uiNativeAssetId).toBe('eip155:1776/slip44:22000119');
      expect(network.nativeAssetId).toBe('eip155:1776/slip44:60');
    });

    it('rejects ERC-20 scenarios on networks that do not seed TST', () => {
      expect(() => prepareCustomNetwork('injective', 'nativeAndErc20')).toThrow(
        'nativeAndErc20 is only defined for xdc, not injective',
      );
    });

    it.each(NON_ZERO_NATIVE_NETWORK_CASES)(
      'injects $id with its native asset for native send',
      ({ id, chainIdHex, clientId, nativeAssetId, nativeCurrency }) => {
        const { fixtures, network } = prepareCustomNetwork(id, 'nativeSend');
        const assetsController = fixtures.data.AssetsController as {
          assetsBalance: Record<string, Record<string, { amount: string }>>;
        };
        const networkEnablementController = fixtures.data
          .NetworkEnablementController as {
          nativeAssetIdentifiers: Record<string, string>;
        };

        expect(networkController(fixtures).selectedNetworkClientId).toBe(
          clientId,
        );
        expect(
          networkController(fixtures).networkConfigurationsByChainId[
            chainIdHex
          ]?.nativeCurrency,
        ).toBe(nativeCurrency);
        expect(enabledEip155(fixtures)).toStrictEqual({
          [chainIdHex]: true,
        });
        expect(network.nativeAssetId).toBe(nativeAssetId);
        expect(
          networkEnablementController.nativeAssetIdentifiers[
            network.caipChainId
          ],
        ).toBe(nativeAssetId);
        expect(
          assetsController.assetsBalance[DEFAULT_FIXTURE_ACCOUNT_ID]?.[
            network.uiNativeAssetId
          ]?.amount,
        ).toBe('25');
      },
    );
  });

  describe('CONVERSION_RATE_NETWORKS', () => {
    it('lists every conversion-rate network', () => {
      expect(CONVERSION_RATE_NETWORKS).toStrictEqual([
        'injective',
        'chiliz',
        'plasma',
        'rootstock',
        'hyperevm',
      ]);
    });
  });

  describe('NON_ZERO_NATIVE_NETWORKS', () => {
    it('lists every non-zero-native regression network', () => {
      expect(NON_ZERO_NATIVE_NETWORKS).toStrictEqual([
        'rootstock',
        'stable',
        'mantle',
        'metis',
        'gnosis',
      ]);
    });
  });
});
