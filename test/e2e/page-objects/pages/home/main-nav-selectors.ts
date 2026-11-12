/**
 * Selector for a main navigation item. The same items render in the bottom nav
 * bar (narrow layout) and in the side nav (wide layout).
 *
 * @param id - The nav item id from `useMainNavItems`, e.g. `home` or `activity`.
 * @returns A CSS selector list matching the item in either layout.
 * @see ui/components/app/bottom-nav-bar/bottom-nav-bar.tsx
 * @see ui/components/app/side-nav/side-nav.tsx
 */
export const mainNavItem = (id: 'home' | 'perps' | 'money' | 'activity') =>
  `[data-testid="bottom-nav-${id}"], [data-testid="side-nav-${id}"]`;
