/**
 * Static fallback for the no-fee deposit token list shown in How it works
 * FAQ #7. Mirrors mobile's `MONEY_NO_FEE_TOKENS_FALLBACK` bullet output so
 * this copy can later be swapped for a flag-derived selector.
 */
export const MONEY_NO_FEE_DEPOSIT_TOKEN_BULLETS = [
  '• Ethereum: USDC, aUSDC, USDT, aUSDT, DAI, aDAI, mUSD',
  '• Linea: mUSD',
  '• Arbitrum: USDC, aUSDCN',
  '• Base: USDC, aUSDC',
  '• BNB Chain: USDC, aUSDC, aUSDT, USDT',
  '• Monad: USDC',
].join('\n');
