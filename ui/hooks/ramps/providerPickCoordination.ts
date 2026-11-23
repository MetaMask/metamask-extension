import { useEffect } from 'react';

let mountedBuyScreens = 0;

/**
 * Marks the Buy screen as the owner of the provider pick while it is mounted,
 * so the start-up picker does not pick for a stale token while the screen
 * picks for the route token.
 */
export function useBuyScreenOwnsProviderPick(): void {
  useEffect(() => {
    mountedBuyScreens += 1;
    return () => {
      mountedBuyScreens -= 1;
    };
  }, []);
}

/**
 * @returns Whether a mounted Buy screen owns the provider pick.
 */
export function isBuyScreenOwningProviderPick(): boolean {
  return mountedBuyScreens > 0;
}
