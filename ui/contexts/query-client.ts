import { QueryClient } from '@tanstack/react-query';

/**
 * UI QueryClient with standard TQ defaults.
 *
 * Domain-specific cache policy (staleTime, gcTime, retry) is set per-query
 * via `get*QueryOptions` from `@metamask/core-backend`, not globally here.
 * This keeps the QueryClient familiar to developers from other TQ projects.
 */
export const queryClient = new QueryClient();
