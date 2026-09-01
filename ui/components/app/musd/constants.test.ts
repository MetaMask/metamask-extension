import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  MUSD_TOKEN,
  MUSD_DECIMALS,
  MUSD_TOKEN_ADDRESS,
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
  MUSD_TOKEN_ADDRESS_BY_CHAIN,
  MUSD_TOKEN_ASSET_ID_BY_CHAIN,
  MUSD_BUYABLE_CHAIN_IDS,
  MUSD_CONVERSION_APY,
  MUSD_CURRENCY,
  TOAST_TRACKING_CLEANUP_DELAY_MS,
  DEFAULT_MUSD_BLOCKED_COUNTRIES,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
  FALLBACK_MIN_ASSET_BALANCE_REQUIRED,
  isMusdToken,
  getMusdTokenAddressForChain,
  getMusdAssetIdForChain,
  isMusdSupportedChain,
  isMusdBuyableOnChain,
} from './constants';

describe('MUSD Constants', () => {
  describe('MUSD_TOKEN', () => {
    it('should have correct symbol', () => {
      expect(MUSD_TOKEN.symbol).toBe('MUSD');
    });

    it('should have correct name', () => {
      expect(MUSD_TOKEN.name).toBe('MUSD');
    });

    it('should have 6 decimals', () => {
      expect(MUSD_TOKEN.decimals).toBe(6);
    });
  });

  describe('MUSD_DECIMALS', () => {
    it('should match MUSD_TOKEN.decimals', () => {
      expect(MUSD_DECIMALS).toBe(MUSD_TOKEN.decimals);
    });

    it('should be 6', () => {
      expect(MUSD_DECIMALS).toBe(6);
    });
  });

  describe('MUSD_TOKEN_ADDRESS', () => {
    it('should be the correct address', () => {
      expect(MUSD_TOKEN_ADDRESS.toLowerCase()).toBe(
        '0xaca92e438df0b2401ff60da7e4337b687a2435da',
      );
    });

    it('should be a valid hex address', () => {
      expect(MUSD_TOKEN_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/u);
    });
  });

  describe('MUSD_CONVERSION_DEFAULT_CHAIN_ID', () => {
    it('should default to Ethereum Mainnet', () => {
      expect(MUSD_CONVERSION_DEFAULT_CHAIN_ID).toBe(CHAIN_IDS.MAINNET);
    });
  });

  describe('MUSD_TOKEN_ADDRESS_BY_CHAIN', () => {
    it('should have same address for Mainnet', () => {
      expect(MUSD_TOKEN_ADDRESS_BY_CHAIN[CHAIN_IDS.MAINNET]).toBe(
        MUSD_TOKEN_ADDRESS,
      );
    });

    it('should have same address for Linea Mainnet', () => {
      expect(MUSD_TOKEN_ADDRESS_BY_CHAIN[CHAIN_IDS.LINEA_MAINNET]).toBe(
        MUSD_TOKEN_ADDRESS,
      );
    });

    it('should have same address for BSC', () => {
      expect(MUSD_TOKEN_ADDRESS_BY_CHAIN[CHAIN_IDS.BSC]).toBe(
        MUSD_TOKEN_ADDRESS,
      );
    });
  });

  describe('MUSD_TOKEN_ASSET_ID_BY_CHAIN', () => {
    it('should have correct CAIP-19 asset ID for Mainnet', () => {
      expect(MUSD_TOKEN_ASSET_ID_BY_CHAIN[CHAIN_IDS.MAINNET]).toBe(
        'eip155:1/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      );
    });

    it('should have correct CAIP-19 asset ID for Linea Mainnet', () => {
      expect(MUSD_TOKEN_ASSET_ID_BY_CHAIN[CHAIN_IDS.LINEA_MAINNET]).toBe(
        'eip155:59144/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      );
    });

    it('should have correct CAIP-19 asset ID for BSC', () => {
      expect(MUSD_TOKEN_ASSET_ID_BY_CHAIN[CHAIN_IDS.BSC]).toBe(
        'eip155:56/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      );
    });
  });

  describe('MUSD_BUYABLE_CHAIN_IDS', () => {
    it('should include Mainnet', () => {
      expect(MUSD_BUYABLE_CHAIN_IDS).toContain(CHAIN_IDS.MAINNET);
    });

    it('should include Linea Mainnet', () => {
      expect(MUSD_BUYABLE_CHAIN_IDS).toContain(CHAIN_IDS.LINEA_MAINNET);
    });

    it('should not include BSC (buy routes not yet available)', () => {
      expect(MUSD_BUYABLE_CHAIN_IDS).not.toContain(CHAIN_IDS.BSC);
    });
  });

  describe('MUSD_CONVERSION_APY', () => {
    it('should be 3%', () => {
      expect(MUSD_CONVERSION_APY).toBe(3);
    });
  });

  describe('MUSD_CURRENCY', () => {
    it('should be MUSD', () => {
      expect(MUSD_CURRENCY).toBe('MUSD');
    });
  });

  describe('TOAST_TRACKING_CLEANUP_DELAY_MS', () => {
    it('should be 5000ms', () => {
      expect(TOAST_TRACKING_CLEANUP_DELAY_MS).toBe(5000);
    });
  });

  describe('DEFAULT_MUSD_BLOCKED_COUNTRIES', () => {
    it('should include GB (Great Britain)', () => {
      expect(DEFAULT_MUSD_BLOCKED_COUNTRIES).toContain('GB');
    });

    it('should only have GB by default', () => {
      expect(DEFAULT_MUSD_BLOCKED_COUNTRIES).toStrictEqual(['GB']);
    });
  });

  describe('MUSD_CONVERSION_BONUS_TERMS_OF_USE', () => {
    it('should be a valid URL', () => {
      expect(MUSD_CONVERSION_BONUS_TERMS_OF_USE).toMatch(/^https:\/\//u);
    });

    it('should point to MetaMask terms', () => {
      expect(MUSD_CONVERSION_BONUS_TERMS_OF_USE).toBe(
        'https://metamask.io/musd-bonus-terms-of-use',
      );
    });
  });

  describe('FALLBACK_MIN_ASSET_BALANCE_REQUIRED', () => {
    it('should be 0.01 (1 cent USD)', () => {
      expect(FALLBACK_MIN_ASSET_BALANCE_REQUIRED).toBe(0.01);
    });
  });
});

describe('MUSD Utility Functions', () => {
  describe('isMusdToken', () => {
    it('should return true for mUSD address (lowercase)', () => {
      expect(isMusdToken('0xaca92e438df0b2401ff60da7e4337b687a2435da')).toBe(
        true,
      );
    });

    it('should return true for mUSD address (checksummed)', () => {
      expect(isMusdToken('0xacA92E438df0B2401fF60dA7E4337B687a2435DA')).toBe(
        true,
      );
    });

    it('should return false for undefined', () => {
      expect(isMusdToken()).toBe(false);
    });

    it('should return false for null', () => {
      expect(isMusdToken(null as unknown as string)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isMusdToken('')).toBe(false);
    });

    it('should return false for other addresses', () => {
      expect(isMusdToken('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBe(
        false,
      );
    });
  });

  describe('getMusdTokenAddressForChain', () => {
    it('should return mUSD address for Mainnet', () => {
      expect(getMusdTokenAddressForChain(CHAIN_IDS.MAINNET)).toBe(
        MUSD_TOKEN_ADDRESS,
      );
    });

    it('should return mUSD address for Linea', () => {
      expect(getMusdTokenAddressForChain(CHAIN_IDS.LINEA_MAINNET)).toBe(
        MUSD_TOKEN_ADDRESS,
      );
    });

    it('should return mUSD address when chain ID has uppercase hex', () => {
      expect(getMusdTokenAddressForChain('0xE708' as `0x${string}`)).toBe(
        MUSD_TOKEN_ADDRESS,
      );
    });

    it('should return undefined for unsupported chain', () => {
      expect(
        getMusdTokenAddressForChain('0x89' as `0x${string}`),
      ).toBeUndefined();
    });
  });

  describe('getMusdAssetIdForChain', () => {
    it('should return asset ID for Mainnet', () => {
      expect(getMusdAssetIdForChain(CHAIN_IDS.MAINNET)).toBe(
        'eip155:1/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      );
    });

    it('should return asset ID for Linea', () => {
      expect(getMusdAssetIdForChain(CHAIN_IDS.LINEA_MAINNET)).toBe(
        'eip155:59144/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      );
    });

    it('should return asset ID when chain ID has uppercase hex', () => {
      expect(getMusdAssetIdForChain('0xE708' as `0x${string}`)).toBe(
        'eip155:59144/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      );
    });

    it('should return undefined for unsupported chain', () => {
      expect(getMusdAssetIdForChain('0x89' as `0x${string}`)).toBeUndefined();
    });
  });

  describe('isMusdSupportedChain', () => {
    it('should return true for supported chain (lowercase)', () => {
      expect(isMusdSupportedChain(CHAIN_IDS.LINEA_MAINNET)).toBe(true);
    });

    it('should return true for supported chain with uppercase hex', () => {
      expect(isMusdSupportedChain('0xE708' as `0x${string}`)).toBe(true);
    });

    it('should return false for unsupported chain', () => {
      expect(isMusdSupportedChain('0x89' as `0x${string}`)).toBe(false);
    });
  });

  describe('isMusdBuyableOnChain', () => {
    it('should return true for buyable chain (lowercase)', () => {
      expect(isMusdBuyableOnChain(CHAIN_IDS.MAINNET)).toBe(true);
    });

    it('should return true for buyable chain with uppercase hex', () => {
      expect(isMusdBuyableOnChain('0xE708' as `0x${string}`)).toBe(true);
    });

    it('should return false for non-buyable chain', () => {
      expect(isMusdBuyableOnChain('0x89' as `0x${string}`)).toBe(false);
    });
  });
});
