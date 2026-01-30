import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  PerpsStreamManager,
  getStreamManagerInstance,
} from './PerpsStreamManager';

/**
 * Context for PerpsStreamManager
 */
const PerpsStreamContext = createContext<PerpsStreamManager | null>(null);

/**
 * Props for PerpsStreamProvider
 */
export interface PerpsStreamProviderProps {
  children: ReactNode;
  /** Optional custom stream manager for testing */
  testStreamManager?: PerpsStreamManager;
}

/**
 * Provider component for PerpsStreamManager
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
  testStreamManager,
}) => {
  // Use provided test manager or singleton instance
  const streamManager = useMemo(() => {
    return testStreamManager ?? getStreamManagerInstance();
  }, [testStreamManager]);

  return (
    <PerpsStreamContext.Provider value={streamManager}>
      {children}
    </PerpsStreamContext.Provider>
  );
};

/**
 * Hook to access the PerpsStreamManager
 *
 * Must be used within a PerpsStreamProvider.
 *
 * @returns The PerpsStreamManager instance
 * @throws Error if used outside of PerpsStreamProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const stream = usePerpsStream();
 *
 *   useEffect(() => {
 *     const unsubscribe = stream.positions.subscribe({
 *       callback: (positions) => console.log(positions),
 *     });
 *     return unsubscribe;
 *   }, [stream]);
 * }
 * ```
 */
export function usePerpsStream(): PerpsStreamManager {
  const context = useContext(PerpsStreamContext);

  if (!context) {
    throw new Error(
      'usePerpsStream must be used within a PerpsStreamProvider. ' +
        'Wrap your component tree with <PerpsStreamProvider>.',
    );
  }

  return context;
}

// Export context for advanced use cases
export { PerpsStreamContext };
