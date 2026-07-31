/** Solana account id used in default multichain fixtures. */
export const SOL_ACCOUNT_ID = '688e01b8-3134-4ef4-80e6-8772bab38ef7';

export const SOL_CAIP_ASSET =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

export const USDC_CAIP_ASSET =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

/** Matches `mockPriceApiSpotPrice` in common-solana (50 SOL → $5,643.50). */
export const SOL_SPOT_PRICE_USD = 112.87;

/** Spot price used by swap / SPL send mocks. */
export const SOL_SWAP_SPOT_PRICE_USD = 168.88;

export const USDC_SPOT_PRICE_USD = 0.999761;

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const SOL_BALANCE_HUMAN = '50';

export const USDC_BALANCE_HUMAN = '8.908267';

export const SOL_BALANCE_LAMPORTS = 50 * LAMPORTS_PER_SOL;

export const SOL = {
  decimals: 9,
  name: 'Solana',
  symbol: 'SOL',
  type: 'native' as const,
  image:
    'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
};

export const USDC = {
  decimals: 6,
  name: 'USD Coin',
  symbol: 'USDC',
  type: 'token' as const,
  mint: USDC_MINT,
  image:
    'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
};
