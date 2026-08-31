import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../constants';
import {
  CONVERSION_RATE_NETWORKS,
  NON_ZERO_NATIVE_NETWORKS,
  prepareCustomNetwork,
} from './custom-network-harness';

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

    it('injects Mantle with the non-zero native asset id for native send', () => {
      const { fixtures, network } = prepareCustomNetwork(
        'mantle',
        'nativeSend',
      );
      const assetsController = fixtures.data.AssetsController as {
        assetsBalance: Record<string, Record<string, { amount: string }>>;
      };

      expect(networkController(fixtures).selectedNetworkClientId).toBe(
        'mantle-local',
      );
      expect(
        networkController(fixtures).networkConfigurationsByChainId['0x1388']
          ?.nativeCurrency,
      ).toBe('MNT');
      expect(enabledEip155(fixtures)).toStrictEqual({ '0x1388': true });
      expect(network.nativeSymbol).toBe('MNT');
      expect(network.nativeAssetId).toBe(
        'eip155:5000/erc20:0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000',
      );
      expect(
        assetsController.assetsBalance[DEFAULT_FIXTURE_ACCOUNT_ID]?.[
          network.uiNativeAssetId
        ]?.amount,
      ).toBe('25');
    });

    it('injects Metis with the non-zero native asset id for native send', () => {
      const { fixtures, network } = prepareCustomNetwork('metis', 'nativeSend');

      expect(networkController(fixtures).selectedNetworkClientId).toBe(
        'metis-local',
      );
      expect(
        networkController(fixtures).networkConfigurationsByChainId['0x440']
          ?.nativeCurrency,
      ).toBe('METIS');
      expect(enabledEip155(fixtures)).toStrictEqual({ '0x440': true });
      expect(network.uiNativeAssetId).toBe(
        'eip155:1088/erc20:0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000',
      );
    });
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
