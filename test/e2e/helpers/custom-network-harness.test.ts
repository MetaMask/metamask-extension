import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../constants';
import {
  CONVERSION_RATE_NETWORKS,
  FRXUSD_ASSET_ID,
  FRXUSD_HUMAN_BALANCE,
  FRXUSD_SYMBOL,
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

    it('lists every conversion-rate network', () => {
      expect(CONVERSION_RATE_NETWORKS).toStrictEqual([
        'injective',
        'chiliz',
        'plasma',
        'rootstock',
        'hyperevm',
      ]);
    });

    it('rejects ERC-20 scenarios on networks that do not seed TST', () => {
      expect(() => prepareCustomNetwork('injective', 'nativeAndErc20')).toThrow(
        'nativeAndErc20 is only defined for xdc, not injective',
      );
    });

    it('seeds HyperEVM native HYPE and 6-decimal frxUSD for wrongDecimals', () => {
      const { fixtures, network, unifiedEvmAccountsApiBalances } =
        prepareCustomNetwork('hyperevm', 'wrongDecimals');
      const assetsController = fixtures.data.AssetsController as {
        customAssets: Record<string, string[]>;
        assetsBalance: Record<string, Record<string, { amount: string }>>;
        assetsInfo: Record<string, { decimals: number; symbol: string }>;
      };
      const accountAssets = assetsController.assetsBalance[
        DEFAULT_FIXTURE_ACCOUNT_ID
      ] as Record<string, { amount: string }>;

      expect(networkController(fixtures).selectedNetworkClientId).toBe(
        'hyperevm-local',
      );
      expect(network.nativeSymbol).toBe('HYPE');
      expect(accountAssets[network.uiNativeAssetId]?.amount).toBe('25');
      expect(accountAssets[FRXUSD_ASSET_ID]?.amount).toBe(FRXUSD_HUMAN_BALANCE);
      expect(assetsController.assetsInfo[FRXUSD_ASSET_ID]?.decimals).toBe(6);
      expect(assetsController.assetsInfo[FRXUSD_ASSET_ID]?.symbol).toBe(
        FRXUSD_SYMBOL,
      );
      expect(
        assetsController.customAssets[DEFAULT_FIXTURE_ACCOUNT_ID],
      ).toContain(FRXUSD_ASSET_ID);
      expect(unifiedEvmAccountsApiBalances?.additionalBalances).toStrictEqual([
        { assetId: network.uiNativeAssetId, balance: '25' },
        { assetId: FRXUSD_ASSET_ID, balance: FRXUSD_HUMAN_BALANCE },
      ]);
    });

    it('rejects the wrongDecimals scenario on networks other than HyperEVM', () => {
      expect(() => prepareCustomNetwork('xdc', 'wrongDecimals')).toThrow(
        'wrongDecimals is only defined for hyperevm, not xdc',
      );
    });
  });
});
