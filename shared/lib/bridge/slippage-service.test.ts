// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import type { BridgeToken } from '../../../ui/ducks/bridge/types';
import { MultichainNetworks } from '../../constants/multichain/networks';
import {
  SlippageService,
  SlippageValue,
  type SlippageContext,
} from './slippage-service';

describe('SlippageService', () => {
  // Mock tokens
  const mockUSDC: BridgeToken = {
    chainId: '0x1',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    symbol: 'USDC',
    decimals: 6,
    image: '',
    balance: '0',
    string: '0',
  };

  const mockUSDT: BridgeToken = {
    chainId: '0x1',
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    symbol: 'USDT',
    decimals: 6,
    image: '',
    balance: '0',
    string: '0',
  };

  const mockWETH: BridgeToken = {
    chainId: '0x1',
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    symbol: 'WETH',
    decimals: 18,
    image: '',
    balance: '0',
    string: '0',
  };

  const mockSolanaToken: BridgeToken = {
    chainId: MultichainNetworks.SOLANA,
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    decimals: 9,
    image: '',
    balance: '0',
    string: '0',
  };

  describe('calculateSlippage', () => {
    describe('Bridge transactions', () => {
      it('returns 0.5% for all bridge routes', () => {
        const context: SlippageContext = {
          fromChain: { chainId: '0x1' },
          toChain: { chainId: '0xa' },
          fromToken: mockWETH,
          toToken: mockWETH,
          isSwap: false,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });

      it('returns 0.5% for bridge even with stablecoins', () => {
        const context: SlippageContext = {
          fromChain: { chainId: '0x1' },
          toChain: { chainId: '0xa' },
          fromToken: mockUSDC,
          toToken: mockUSDC,
          isSwap: false,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });
    });

    describe('Solana swaps', () => {
      it('returns undefined (AUTO mode) for Solana to Solana swaps', () => {
        const context: SlippageContext = {
          fromChain: { chainId: MultichainNetworks.SOLANA },
          toChain: { chainId: MultichainNetworks.SOLANA },
          fromToken: mockSolanaToken,
          toToken: mockSolanaToken,
          isSwap: true,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(undefined);
      });
    });

    describe('EVM swaps', () => {
      it('returns 0.5% for EVM stablecoin pairs', () => {
        const context: SlippageContext = {
          fromChain: { chainId: '0x1' },
          toChain: { chainId: '0x1' },
          fromToken: mockUSDC,
          toToken: mockUSDT,
          isSwap: true,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmStablecoin);
      });

      it('returns 2% for non-stablecoin EVM swaps', () => {
        const context: SlippageContext = {
          fromChain: { chainId: '0x1' },
          toChain: { chainId: '0x1' },
          fromToken: mockWETH,
          toToken: mockUSDC,
          isSwap: true,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });

      it('returns 2% for unknown token addresses', () => {
        const unknownToken: BridgeToken = {
          ...mockWETH,
          address: '0xunknown',
        };

        const context: SlippageContext = {
          fromChain: { chainId: '0x1' },
          toChain: { chainId: '0x1' },
          fromToken: unknownToken,
          toToken: unknownToken,
          isSwap: true,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });
    });

    describe('Edge cases', () => {
      it('returns bridge default when fromChain is null', () => {
        const context: SlippageContext = {
          fromChain: null,
          toChain: { chainId: '0x1' },
          fromToken: mockWETH,
          toToken: mockWETH,
          isSwap: true,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });

      it('returns bridge default when fromChain is undefined', () => {
        const context: SlippageContext = {
          fromChain: undefined,
          toChain: { chainId: '0x1' },
          fromToken: mockWETH,
          toToken: mockWETH,
          isSwap: true,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.BridgeDefault);
      });

      it('returns EVM default when toChain is missing for swap', () => {
        const context: SlippageContext = {
          fromChain: { chainId: '0x1' },
          toChain: null,
          fromToken: mockWETH,
          toToken: mockWETH,
          isSwap: true,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });

      it('handles case-insensitive stablecoin addresses', () => {
        const uppercaseUSDC: BridgeToken = {
          ...mockUSDC,
          address: '0xA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48', // Uppercase
        };

        const context: SlippageContext = {
          fromChain: { chainId: '0x1' },
          toChain: { chainId: '0x1' },
          fromToken: uppercaseUSDC,
          toToken: mockUSDT,
          isSwap: true,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmStablecoin);
      });

      it('returns EVM default when only one token is stablecoin', () => {
        const context: SlippageContext = {
          fromChain: { chainId: '0x1' },
          toChain: { chainId: '0x1' },
          fromToken: mockUSDC,
          toToken: mockWETH,
          isSwap: true,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });

      it('handles missing tokens gracefully', () => {
        const context: SlippageContext = {
          fromChain: { chainId: '0x1' },
          toChain: { chainId: '0x1' },
          fromToken: null,
          toToken: null,
          isSwap: true,
        };

        const result = SlippageService.calculateSlippage(context);
        expect(result).toBe(SlippageValue.EvmDefault);
      });
    });
  });

  describe('getSlippageReason', () => {
    it('returns correct reason for bridge', () => {
      const context: SlippageContext = {
        fromChain: { chainId: '0x1' },
        toChain: { chainId: '0xa' },
        fromToken: mockWETH,
        toToken: mockWETH,
        isSwap: false,
      };

      const reason = SlippageService.getSlippageReason(context);
      expect(reason).toBe('Cross-chain bridge transaction');
    });

    it('returns correct reason for incomplete swap', () => {
      const context: SlippageContext = {
        fromChain: { chainId: '0x1' },
        toChain: null,
        fromToken: mockWETH,
        toToken: mockWETH,
        isSwap: true,
      };

      const reason = SlippageService.getSlippageReason(context);
      expect(reason).toBe('Incomplete swap setup - using EVM default');
    });

    it('returns correct reason for Solana swap', () => {
      const context: SlippageContext = {
        fromChain: { chainId: MultichainNetworks.SOLANA },
        toChain: { chainId: MultichainNetworks.SOLANA },
        fromToken: mockSolanaToken,
        toToken: mockSolanaToken,
        isSwap: true,
      };

      const reason = SlippageService.getSlippageReason(context);
      expect(reason).toBe('Solana swap (AUTO mode)');
    });

    it('returns correct reason for stablecoin pair', () => {
      const context: SlippageContext = {
        fromChain: { chainId: '0x1' },
        toChain: { chainId: '0x1' },
        fromToken: mockUSDC,
        toToken: mockUSDT,
        isSwap: true,
      };

      const reason = SlippageService.getSlippageReason(context);
      expect(reason).toBe('EVM stablecoin pair');
    });

    it('returns correct reason for EVM swap', () => {
      const context: SlippageContext = {
        fromChain: { chainId: '0x1' },
        toChain: { chainId: '0x1' },
        fromToken: mockWETH,
        toToken: mockUSDC,
        isSwap: true,
      };

      const reason = SlippageService.getSlippageReason(context);
      expect(reason).toBe('EVM token swap');
    });

    it('returns correct reason when no chain', () => {
      const context: SlippageContext = {
        fromChain: null,
        toChain: null,
        fromToken: mockWETH,
        toToken: mockWETH,
        isSwap: true,
      };

      const reason = SlippageService.getSlippageReason(context);
      expect(reason).toBe('No source chain - using bridge default');
    });
  });
});
