import { MOCK_ETH_CONVERSION_RATE } from '../tests/tokens/utils/mocks';
import {
  catalogResponses,
  requestedAssetIdsFromUrl,
} from './token-price-mock-catalog';

const INJ_NATIVE = {
  name: 'Injective',
  symbol: 'INJ',
  decimals: 18,
  idPrefixes: ['eip155:1776/'],
};

const XDC_NATIVE = {
  name: 'XDC Network',
  symbol: 'XDC',
  decimals: 18,
  assetIds: ['eip155:50/slip44:60'],
};

/**
 * Same shape `nativeCatalogAsset` builds for XDC: exact native ids plus a
 * whole-chain prefix so runtime slip44 variants still match.
 */
const XDC_NATIVE_WITH_CHAIN_PREFIX = {
  ...XDC_NATIVE,
  idPrefixes: ['eip155:50/'],
};

const XDC_ERC20 = {
  name: 'TST',
  symbol: 'TST',
  decimals: 4,
  assetIds: ['eip155:50/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947'],
  priceInUsd: 1,
};

describe('token-price-mock-catalog', () => {
  describe('requestedAssetIdsFromUrl', () => {
    it('splits repeated and comma-separated assetIds query params', () => {
      expect(
        requestedAssetIdsFromUrl(
          'https://tokens.api.cx.metamask.io/v3/assets?assetIds=eip155:50/slip44:60&assetIds=eip155:50/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947',
        ),
      ).toStrictEqual([
        'eip155:50/slip44:60',
        'eip155:50/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947',
      ]);
    });
  });

  describe('catalogResponses', () => {
    it('echoes the requested native id when matching a chain prefix', () => {
      const responses = catalogResponses({
        assets: [INJ_NATIVE],
        priceMode: 'quoted',
        requestedAssetIds: ['eip155:1776/slip44:22000119'],
      });

      expect(responses.assetsMetadata).toStrictEqual([
        {
          assetId: 'eip155:1776/slip44:22000119',
          name: 'Injective',
          symbol: 'INJ',
          decimals: 18,
        },
      ]);
      expect(responses.spotPrices['eip155:1776/slip44:22000119']?.price).toBe(
        MOCK_ETH_CONVERSION_RATE,
      );
    });

    it('returns metadata and prices for every matching asset from one request', () => {
      const responses = catalogResponses({
        assets: [XDC_NATIVE, XDC_ERC20],
        priceMode: 'quoted',
        requestedAssetIds: [
          'eip155:50/slip44:60',
          'eip155:50/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947',
        ],
      });

      expect(responses.assetsMetadata).toHaveLength(2);
      expect(responses.spotPrices['eip155:50/slip44:60']?.price).toBe(
        MOCK_ETH_CONVERSION_RATE,
      );
      expect(
        responses.spotPrices[
          'eip155:50/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947'
        ]?.price,
      ).toBe(1);
    });

    it('prefers an exact ERC-20 id over a native whole-chain prefix', () => {
      const erc20Id =
        'eip155:50/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947';
      const responses = catalogResponses({
        assets: [XDC_NATIVE_WITH_CHAIN_PREFIX, XDC_ERC20],
        priceMode: 'quoted',
        requestedAssetIds: ['eip155:50/slip44:60', erc20Id],
      });

      expect(responses.assetsMetadata).toStrictEqual([
        {
          assetId: 'eip155:50/slip44:60',
          name: 'XDC Network',
          symbol: 'XDC',
          decimals: 18,
        },
        {
          assetId: erc20Id,
          name: 'TST',
          symbol: 'TST',
          decimals: 4,
        },
      ]);
      expect(responses.spotPrices[erc20Id]?.price).toBe(1);
      expect(responses.spotPrices[erc20Id]?.id).toBe('tst');
    });

    it('returns empty spot prices in unsupported mode while still serving metadata', () => {
      const responses = catalogResponses({
        assets: [
          {
            name: 'HyperEVM',
            symbol: 'HYPE',
            decimals: 18,
            idPrefixes: ['eip155:999/'],
          },
        ],
        priceMode: 'unsupported',
        requestedAssetIds: ['eip155:999/slip44:2457'],
      });

      expect(responses.spotPrices).toStrictEqual({});
      expect(responses.assetsMetadata[0]?.symbol).toBe('HYPE');
      expect(responses.exchangeRates.eth?.ticker).toBe('eth');
      expect(responses.exchangeRates.hype).toBeUndefined();
    });

    it('returns an empty metadata list for unrecognised asset ids', () => {
      const responses = catalogResponses({
        assets: [XDC_NATIVE],
        priceMode: 'quoted',
        requestedAssetIds: ['eip155:1/slip44:60'],
      });

      expect(responses.assetsMetadata).toStrictEqual([]);
      expect(responses.spotPrices).toStrictEqual({});
    });
  });
});
