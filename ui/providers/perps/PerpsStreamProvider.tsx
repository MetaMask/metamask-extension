import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { createMockPerpsClient } from './MockPerpsClient';
import type { PerpsClient } from './PerpsClient.types';

/**
 * Context for PerpsClient
 */
const PerpsClientContext = createContext<PerpsClient | null>(null);

/**
 * Props for PerpsStreamProvider
 */
export interface PerpsStreamProviderProps {
  children: ReactNode;
  /** Optional custom client for testing */
  client?: PerpsClient;
}

/**
 * Provider component for PerpsClient
 *
 * Wrap your Perps UI components with this provider to enable
 * real-time data subscriptions via stream hooks.
 *
 * @example
 * ```tsx
 * <PerpsStreamProvider>
 *   <PerpsHomePage />
 * </PerpsStreamProvider>
 * ```
 */
export const PerpsStreamProvider: React.FC<PerpsStreamProviderProps> = ({
  children,
  client,
}) => {
  // Use provided client or create mock client
  const perpsClient = useMemo(() => {
    return client ?? createMockPerpsClient();
  }, [client]);

  return (
    <PerpsClientContext.Provider value={perpsClient}>
      {children}
    </PerpsClientContext.Provider>
  );
};

/**
 * Hook to access the PerpsClient
 *
 * Must be used within a PerpsStreamProvider.
 *
 * @returns The PerpsClient instance
 * @throws Error if used outside of PerpsStreamProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const client = usePerpsClient();
 *
 *   useEffect(() => {
 *     const unsubscribe = client.streams.positions.subscribe({
 *       callback: (positions) => console.log(positions),
 *     });
 *     return unsubscribe;
 *   }, [client]);
 * }
 * ```
 */
export function usePerpsClient(): PerpsClient {
  const context = useContext(PerpsClientContext);

  if (!context) {
    throw new Error(
      'usePerpsClient must be used within a PerpsStreamProvider. ' +
        'Wrap your component tree with <PerpsStreamProvider>.',
    );
  }

  return context;
}

/**
 * @deprecated Use usePerpsClient() instead.
 * This alias is kept for backward compatibility during migration.
 *
 * Note: The returned client has a different API than the old PerpsStreamManager.
 * Stream hooks have been updated to use client.streams.* pattern.
 */
export function usePerpsStream(): PerpsClient {
  return usePerpsClient();
}

// Export context for advanced use cases
export { PerpsClientContext };

// Re-export PerpsClient type for convenience
export type { PerpsClient };
