import React, { createContext, ReactNode, useContext } from 'react';
import { UIMessenger } from '../messengers/ui-messenger';

/**
 * Context that holds the UI messenger.
 */
export const UIMessengerContext = createContext<UIMessenger | null>(null);

/**
 * Provides the UI messenger to child components via context.
 *
 * @param args - The arguments to this function.
 * @param args.value - The UI messenger to load into context.
 * @param args.children - The components to wrap.
 */
export const UIMessengerProvider = ({
  value,
  children,
}: {
  value: UIMessenger;
  children: ReactNode;
}) => {
  return (
    <UIMessengerContext.Provider value={value}>
      {children}
    </UIMessengerContext.Provider>
  );
};

/**
 * Hook to access the UI messenger from context.
 *
 * Used to derive route-level messengers. Do not use this hook directly,
 * only use it to define route-level messenger hooks.
 *
 * @returns The UI messenger in context.
 * @throws If the UI messenger is not available (e.g., hook is used outside of
 * the provider).
 */
export function useUIMessenger(): UIMessenger {
  const messenger = useContext(UIMessengerContext);

  if (!messenger) {
    throw new Error(
      'The `useUIMessenger` hook must be used within a `UIMessengerProvider`.',
    );
  }

  return messenger;
}
