/**
 * Utility functions for detecting and working with dapps
 */

/**
 * Checks if the current tab origin is a known Solana dapp
 * This is a simplified implementation that checks for common Solana dapp patterns
 * 
 * @param origin - The origin URL to check
 * @returns true if the origin appears to be a Solana dapp
 */
export function isCurrentTabSolanaDapp(origin: string): boolean {
  if (!origin) {
    return false;
  }

  // Common Solana dapp patterns and known Solana ecosystem sites
  const solanaDappPatterns = [
    /solana/i,
    /phantom/i,
    /magic.?eden/i,
    /solanart/i,
    /jup/i,
    /marinade/i,
    /tulip/i,
    /serum/i,
    /raydium/i,
    /orca/i,
    /mango/i,
    /solend/i,
    /tensor/i,
    /metaplex/i,
    /saber/i,
    /drift/i,
    /stepn/i,
    /star.?atlas/i,
    /degenerateape/i,
  ];
  
  return solanaDappPatterns.some(pattern => pattern.test(origin));
}

/**
 * Alternative implementation that could check for Solana provider
 * This would require access to the tab's window object and is not currently used
 * 
 * @returns true if a Solana provider is detected
 */
export function hasSolanaProvider(): boolean {
  return typeof window !== 'undefined' && 
         !!(window as any).solana || 
         !!(window as any).solflare || 
         !!(window as any).phantom;
}
