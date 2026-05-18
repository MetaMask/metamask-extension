import type { CaipChainId, CaipAssetType } from '@metamask/utils';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import {
  calculateSlippage,
  getSlippageReason,
  SlippageValue,
  type SlippageContext,
} from './slippage-service';

describe('Slippage Service', () => {
  // Mock tokens
  const mockUSDC = (chainId: CaipChainId = 'eip155:1') => ({
    chainId,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    assetId: toAssetId(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      chainId,
    ) as CaipAssetType,
    symbol: 'USDC',
    decimals: 6,
    iconUrl: '',
    balance: '0',
    name: 'USDC',
  });

  const mockUSDT = (chainId: CaipChainId = 'eip155:1') => ({
    chainId,
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    assetId: toAssetId(
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
      chainId,
    ) as CaipAssetType,
    symbol: 'USDT',
    decimals: 6,
    iconUrl: '',
    balance: '0',
    name: 'USDT',
  });

  const mockWETH = (
    chainId: CaipChainId = 'eip155:1',
    address: string = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  ) => ({
    chainId,
    address,
    assetId: toAssetId(address, chainId) as CaipAssetType,
    symbol: 'WETH',
    decimals: 18,
    iconUrl: '',
    balance: '0',
    name: 'WETH',
  });

  const mockSolanaToken: BridgeToken = {
    chainId: MultichainNetworks.SOLANA,
    assetId:
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    decimals: 9,
    iconUrl: '',
    balance: '0',
    name: 'SOL',
  };

  const mockRWAToken = (chainId: CaipChainId = 'eip155:1'): BridgeToken => ({
    ...mockWETH(chainId),
    symbol: 'AAPL',
    name: 'Apple Inc.',
    rwaData: {
      instrumentType: 'stock',
      market: {
        nextOpen: new Date(Date.now() - 1000).toISOString(),
        nextClose: new Date(Date.now() + 3_600_000).toISOString(),
      },
    },
  });

  describe('calculateSlippage', () => {
    describe('Bridge transactions', () => {
      it('returns 0.5% for all bridge routes', () => {
        const context: SlippageContext = {
          fromToken: mockWETH(),
          toToken: mockWETH('eip155:10'),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });

      it('returns 0.5% for bridge even with stablecoins', () => {
        const context: SlippageContext = {
          fromToken: mockUSDC(),
          toToken: mockUSDC('eip155:10'),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });
    });

    describe('Solana swaps', () => {
      it('returns undefined (AUTO mode) for Solana to Solana swaps', () => {
        const context: SlippageContext = {
          fromToken: mockSolanaToken,
          toToken: mockSolanaToken,
        };

        const result = calculateSlippage(context);
        expect(result).toBe(undefined);
      });
    });

    describe('RWA token swaps', () => {
      it('returns undefined (AUTO mode) when source token is an RWA token and RWA is enabled', () => {
        const context: SlippageContext = {
          fromToken: mockRWAToken(),
          toToken: mockWETH(),
          isRWAEnabled: true,
        };

        const result = calculateSlippage(context);
        expect(result).toBe(undefined);
      });

      it('returns undefined (AUTO mode) when destination token is an RWA token and RWA is enabled', () => {
        const context: SlippageContext = {
          fromToken: mockWETH(),
          toToken: mockRWAToken(),
          isRWAEnabled: true,
        };

        const result = calculateSlippage(context);
        expect(result).toBe(undefined);
      });

      it('returns undefined (AUTO mode) when both tokens are RWA tokens and RWA is enabled', () => {
        const context: SlippageContext = {
          fromToken: mockRWAToken(),
          toToken: mockRWAToken(),
          isRWAEnabled: true,
        };

        const result = calculateSlippage(context);
        expect(result).toBe(undefined);
      });

      it('returns 2% (bridge default) for cross-chain swap even when source token is RWA', () => {
        const context: SlippageContext = {
          fromToken: mockRWAToken('eip155:1'),
          toToken: mockRWAToken('eip155:10'),
          isRWAEnabled: true,
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });

      it('falls through to EVM default when RWA token is present but feature flag is disabled', () => {
        const context: SlippageContext = {
          fromToken: mockRWAToken(),
          toToken: mockWETH(),
          isRWAEnabled: false,
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });

      it('falls through to EVM default when RWA token is present and isRWAEnabled is omitted', () => {
        const context: SlippageContext = {
          fromToken: mockRWAToken(),
          toToken: mockWETH(),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });
    });

    describe('EVM swaps', () => {
      it('returns 0.5% for EVM stablecoin pairs', () => {
        const context: SlippageContext = {
          fromToken: mockUSDC(),
          toToken: mockUSDT('eip155:1'),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmStablecoin);
      });

      it('returns 2% for non-stablecoin EVM swaps', () => {
        const context: SlippageContext = {
          fromToken: mockWETH(),
          toToken: mockUSDC(),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });

      it('returns 2% for unknown token addresses', () => {
        const unknownToken: BridgeToken = mockWETH('eip155:1', '0xunknown');

        const context: SlippageContext = {
          fromToken: unknownToken,
          toToken: unknownToken,
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });
    });

    describe('Cross-chain swaps', () => {
      it('returns 0.5% for cross-chain swaps (treated as bridges)', () => {
        const context: SlippageContext = {
          fromToken: mockWETH(),
          toToken: mockWETH('eip155:10'),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });

      it('returns 0.5% for cross-chain stablecoin swaps (treated as bridges)', () => {
        const context: SlippageContext = {
          fromToken: mockUSDC(),
          toToken: mockUSDT('eip155:89'),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });
    });

    describe('Edge cases', () => {
      it('returns bridge default when fromChain is null', () => {
        const context: SlippageContext = {
          fromToken: null as never,
          toToken: mockWETH(),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });

      it('returns bridge default when fromChain is undefined', () => {
        const context: SlippageContext = {
          fromToken: null as never,
          toToken: mockWETH(),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });

      it('returns bridge default when toChain is missing', () => {
        const context: SlippageContext = {
          fromToken: mockWETH(),
          toToken: null as never,
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });

      it('handles case-insensitive stablecoin addresses', () => {
        const token = mockUSDC();
        const uppercaseUSDC: BridgeToken = {
          ...token,
          assetId: token.assetId.toUpperCase() as CaipAssetType,
        };

        const context: SlippageContext = {
          fromToken: uppercaseUSDC,
          toToken: mockUSDT(),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmStablecoin);
      });

      it('returns EVM default when only one token is stablecoin', () => {
        const context: SlippageContext = {
          fromToken: mockUSDC(),
          toToken: mockWETH(),
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });

      it('handles missing tokens gracefully', () => {
        const context: SlippageContext = {
          fromToken: null as never,
          toToken: null as never,
        };

        const result = calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });
    });
  });

  describe('getSlippageReason', () => {
    it('returns correct reason for bridge', () => {
      const context: SlippageContext = {
        fromToken: mockWETH(),
        toToken: mockWETH('eip155:10'),
      };

      const reason = getSlippageReason(context);
      expect(reason).toBe('Cross-chain transaction');
    });

    it('returns correct reason for incomplete swap', () => {
      const context: SlippageContext = {
        fromToken: mockWETH(),
        toToken: null as never,
      };

      const reason = getSlippageReason(context);
      expect(reason).toBe('Incomplete chain setup - using bridge default');
    });

    it('returns correct reason for Solana swap', () => {
      const context: SlippageContext = {
        fromToken: mockSolanaToken,
        toToken: mockSolanaToken,
      };

      const reason = getSlippageReason(context);
      expect(reason).toBe('Solana swap (AUTO mode)');
    });

    it('returns correct reason for RWA token swap', () => {
      const context: SlippageContext = {
        fromToken: mockRWAToken(),
        toToken: mockWETH(),
        isRWAEnabled: true,
      };

      const reason = getSlippageReason(context);
      expect(reason).toBe('RWA token swap (AUTO mode)');
    });

    it('does not return RWA reason when feature flag is disabled', () => {
      const context: SlippageContext = {
        fromToken: mockRWAToken(),
        toToken: mockWETH(),
        isRWAEnabled: false,
      };

      const reason = getSlippageReason(context);
      expect(reason).toBe('EVM token swap');
    });

    it('returns correct reason for stablecoin pair', () => {
      const context: SlippageContext = {
        fromToken: mockUSDC(),
        toToken: mockUSDT(),
      };

      const reason = getSlippageReason(context);
      expect(reason).toBe('EVM stablecoin pair');
    });

    it('returns correct reason for EVM swap', () => {
      const context: SlippageContext = {
        fromToken: mockWETH(),
        toToken: mockUSDC(),
      };

      const reason = getSlippageReason(context);
      expect(reason).toBe('EVM token swap');
    });

    it('returns correct reason for cross-chain swap', () => {
      const context: SlippageContext = {
        fromToken: mockWETH(),
        toToken: mockWETH('eip155:10'),
      };

      const reason = getSlippageReason(context);
      expect(reason).toBe('Cross-chain transaction');
    });

    it('returns correct reason when no chain', () => {
      const context: SlippageContext = {
        fromToken: null as never,
        toToken: null as never,
      };

      const reason = getSlippageReason(context);
      expect(reason).toBe('Incomplete chain setup - using bridge default');
    });
  });
});
