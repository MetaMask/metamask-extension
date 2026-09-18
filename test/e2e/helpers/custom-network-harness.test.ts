import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../constants';
import { catalogResponses } from './token-price-mock-catalog';
import {
  CONVERSION_RATE_NETWORKS,
  getCustomNetwork,
  prepareCustomNetwork,
  type CustomNetworkId,
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

function assetsBalance(
  fixtures: ReturnType<typeof prepareCustomNetwork>['fixtures'],
) {
  return (
    fixtures.data.AssetsController as {
      assetsBalance: Record<string, Record<string, { amount: string }>>;
    }
  ).assetsBalance;
}

/**
 * Same shape `nativeCatalogAsset` builds for conversion-rate networks: exact
 * native ids plus a whole-chain prefix so runtime slip44 variants still match.
 * @param id
 */
function conversionRateCatalogAsset(id: CustomNetworkId) {
  const network = getCustomNetwork(id);
  return {
    name: network.name,
    symbol: network.nativeSymbol,
    decimals: 18,
    assetIds: [network.nativeAssetId, network.uiNativeAssetId],
    idPrefixes: [`${network.caipChainId}/`],
  };
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

    it('seeds the UI native asset id for native send', () => {
      const { fixtures, network } = prepareCustomNetwork(
        'injective',
        'nativeSend',
      );

      expect(
        assetsBalance(fixtures)[DEFAULT_FIXTURE_ACCOUNT_ID]?.[
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

  describe('conversionRate network contract', () => {
    // Per-network differences are data (ids, symbols, chain config), not
    // Tokens-tab behavior. Keep that coverage here so adding a sixth network
    // is a table row, not another E2E.
    CONVERSION_RATE_NETWORKS.forEach((id) => {
      const network = getCustomNetwork(id);

      it(`prepares ${network.name} fixtures, Anvil chain, and quoted catalog ids`, () => {
        const {
          fixtures,
          localNodeOptions,
          network: preparedNetwork,
        } = prepareCustomNetwork(id, 'conversionRate');

        expect(preparedNetwork).toStrictEqual(network);
        expect(networkController(fixtures).selectedNetworkClientId).toBe(
          network.clientId,
        );
        expect(
          networkController(fixtures).networkConfigurationsByChainId[
            network.chainIdHex
          ]?.nativeCurrency,
        ).toBe(network.nativeSymbol);
        expect(enabledEip155(fixtures)).toStrictEqual({
          [network.chainIdHex]: true,
        });
        expect(
          assetsBalance(fixtures)[DEFAULT_FIXTURE_ACCOUNT_ID]?.[
            network.uiNativeAssetId
          ]?.amount,
        ).toBe('25');
        expect(localNodeOptions).toStrictEqual([
          { type: 'anvil', options: { chainId: network.chainIdDecimal } },
        ]);

        // Deduplicate when UI and enablement ids match (e.g. HyperEVM).
        const requestedAssetIds = [
          ...new Set([network.nativeAssetId, network.uiNativeAssetId]),
        ];
        const responses = catalogResponses({
          assets: [conversionRateCatalogAsset(id)],
          priceMode: 'quoted',
          requestedAssetIds,
        });

        for (const assetId of requestedAssetIds) {
          expect(responses.spotPrices[assetId]).toBeDefined();
        }
        expect(responses.assetsMetadata).toStrictEqual(
          requestedAssetIds.map((assetId) => ({
            assetId,
            name: network.name,
            symbol: network.nativeSymbol,
            decimals: 18,
          })),
        );
      });
    });
  });
});
